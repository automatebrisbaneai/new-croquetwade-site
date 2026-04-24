/**
 * edit.js — Shared in-browser site editor
 * Hosted at: https://edit.croquetwade.com/edit.js
 *
 * Activation: add to any site page:
 *   <script src="https://edit.croquetwade.com/edit.js"
 *           data-stack="git"
 *           data-site="cc">
 *   </script>
 *
 * The script only activates when ?edit&t=<token> is in the URL.
 * Without those params the script exits immediately — zero impact on page.
 *
 * Stack A (git-direct): saves POST to git-edit-server which commits + redeploys.
 * Stack B (db overlay): future phase 2, saves PATCH to PocketBase.
 */

(function () {
    'use strict';

    // ── Constants ────────────────────────────────────────────────────────────

    var PB_BASE = 'https://util.croquetwade.com';
    var EDIT_TOKENS_COLLECTION = 'edit_tokens';

    // Read configuration from the script tag itself
    var scriptTag = document.currentScript;
    var STACK = scriptTag ? (scriptTag.getAttribute('data-stack') || 'git') : 'git';
    var SITE = scriptTag ? (scriptTag.getAttribute('data-site') || 'cc') : 'cc';
    // data-server overrides default git-edit-server URL (useful before FQDN is set)
    var GIT_EDIT_SERVER = scriptTag
        ? (scriptTag.getAttribute('data-server') || 'https://edit.croquetwade.com')
        : 'https://edit.croquetwade.com';
    // data-html-file tells the server which file to edit (for subdirectory pages)
    var HTML_FILE = scriptTag ? (scriptTag.getAttribute('data-html-file') || 'index.html') : 'index.html';

    // ── URL Param Detection ──────────────────────────────────────────────────

    var params = new URLSearchParams(window.location.search);
    var hasEditMode = params.has('edit');
    var tokenValue = params.get('t') || null;

    // Exit immediately if not in edit mode — zero page impact
    if (!hasEditMode || !tokenValue) {
        return;
    }

    // ── Desktop-Only Gate ────────────────────────────────────────────────────
    // Editor UX (small click targets, inline contenteditable, ENTER-to-accept)
    // is a desktop interaction. On touch/phone show a friendly banner and
    // exit before token validation (no PocketBase hit).

    var desktopOK = window.matchMedia &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!desktopOK) {
        var banner = document.createElement('div');
        banner.id = 'edit-desktop-only-banner';
        banner.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:12px 16px;background:#1a1a1a;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1.4;border-top:2px solid #f5a623;box-shadow:0 -4px 16px rgba(0,0,0,0.4);display:flex;gap:12px;align-items:flex-start';
        banner.innerHTML =
            '<div style="flex:1">' +
                '<strong style="color:#f5a623">Edit mode is desktop only.</strong> ' +
                'Please reopen this link on a desktop or laptop browser with a mouse or trackpad.' +
            '</div>' +
            '<button type="button" aria-label="Dismiss" style="background:transparent;border:1px solid #555;color:#aaa;padding:2px 10px;border-radius:4px;cursor:pointer;font-size:16px;line-height:1">&times;</button>';
        document.body.appendChild(banner);
        banner.querySelector('button').addEventListener('click', function () {
            banner.remove();
        });
        return;
    }

    // ── Token Validation ─────────────────────────────────────────────────────

    var _validatedToken = null;

    function validateToken(token) {
        var url = PB_BASE + '/api/collections/' + EDIT_TOKENS_COLLECTION +
            '/records?t=' + encodeURIComponent(token) + '&perPage=1&skipTotal=1';
        return fetch(url)
            .then(function (res) {
                if (!res.ok) return null;
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.items || data.items.length === 0) return null;
                var record = data.items[0];
                if (record.revoked) return null;
                // Check site match
                if (record.site && record.site !== SITE) return null;
                // Check expiry
                if (record.expires_at) {
                    var expires = new Date(record.expires_at);
                    if (expires < new Date()) return null;
                }
                return record;
            })
            .catch(function () { return null; });
    }

    // ── UI Helpers ───────────────────────────────────────────────────────────

    function injectStyles() {
        var link = document.createElement('link');
        // Load edit.css from same origin as this script
        var src = scriptTag ? scriptTag.src : '';
        var base = src.replace(/edit\.js.*$/, '');
        link.rel = 'stylesheet';
        link.href = base + 'edit.css';
        document.head.appendChild(link);
    }

    function createStatusBar() {
        var bar = document.createElement('div');
        bar.id = 'edit-status-bar';
        bar.setAttribute('aria-live', 'polite');
        bar.innerHTML =
            '<span id="edit-mode-label">Edit mode</span>' +
            '<span id="edit-status-text"></span>' +
            '<button id="edit-exit-btn" title="Exit edit mode">Exit</button>';
        document.body.appendChild(bar);

        document.getElementById('edit-exit-btn').addEventListener('click', function () {
            var state = bar.getAttribute('data-state');
            if (state === 'saving' || state === 'deploying') {
                if (!window.confirm('A change is still publishing. Leave anyway?')) return;
            }
            // Remove ?edit&t= from URL and reload
            var url = new URL(window.location.href);
            url.searchParams.delete('edit');
            url.searchParams.delete('t');
            window.location.href = url.toString();
        });

        return bar;
    }

    function setStatus(text, state) {
        // state: 'idle' | 'saving' | 'deploying' | 'live' | 'error'
        var el = document.getElementById('edit-status-text');
        var bar = document.getElementById('edit-status-bar');
        if (!el || !bar) return;
        el.textContent = text;
        bar.setAttribute('data-state', state || 'idle');
    }

    // ── Edit Block Activation ────────────────────────────────────────────────

    var _pendingBlocks = {}; // blockId -> {original, current}

    function activateBlocks() {
        var blocks = document.querySelectorAll('[data-edit-id]');
        blocks.forEach(function (block) {
            var blockId = block.getAttribute('data-edit-id');
            var original = block.innerText;
            _pendingBlocks[blockId] = { original: original, current: original };

            block.setAttribute('contenteditable', 'true');
            block.setAttribute('spellcheck', 'true');
            block.classList.add('edit-block');

            // Save on blur
            block.addEventListener('blur', function () {
                var newText = block.innerText.trim();
                if (newText === _pendingBlocks[blockId].current) return;
                _pendingBlocks[blockId].current = newText;
                saveBlock(blockId, newText);
            });

            // Show placeholder if empty
            block.addEventListener('focus', function () {
                block.classList.add('edit-block--active');
            });
            block.addEventListener('blur', function () {
                block.classList.remove('edit-block--active');
            });

            // Enter = accept + save · Escape = cancel (revert to last-saved)
            block.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    block.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    block.innerText = _pendingBlocks[blockId].current;
                    block.blur();
                }
            });
        });

        setStatus('Hover over any text and click to edit it.', 'idle');
    }

    // ── Save Logic ───────────────────────────────────────────────────────────

    var _deployCheckInterval = null;
    var _deployCheckCount = 0;
    var DEPLOY_CHECK_MAX = 24; // 24 * 5s = 120s max

    function blockEl(blockId) {
        var sel = window.CSS && CSS.escape ? CSS.escape(blockId) : blockId;
        return document.querySelector('[data-edit-id="' + sel + '"]');
    }

    function setPending(blockId, on) {
        var el = blockEl(blockId);
        if (!el) return;
        el.classList.toggle('edit-block--pending', !!on);
    }

    function showSavedBadge(blockId) {
        var el = blockEl(blockId);
        if (!el) return;
        var existing = el.querySelector('.edit-block__saved-badge');
        if (existing) existing.remove();
        var badge = document.createElement('span');
        badge.className = 'edit-block__saved-badge';
        badge.textContent = '✓ Saved';
        el.appendChild(badge);
        setTimeout(function () {
            if (badge.parentNode) badge.remove();
        }, 3000);
    }

    function saveBlock(blockId, newText) {
        setStatus('Saving your change…', 'saving');
        setPending(blockId, true);

        if (STACK === 'git') {
            saveViaGit(blockId, newText);
        } else {
            saveViaDB(blockId, newText);
        }
    }

    function saveViaGit(blockId, newText) {
        fetch(GIT_EDIT_SERVER + '/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: tokenValue,
                site: SITE,
                block_id: blockId,
                new_text: newText,
                html_file: HTML_FILE
            })
        })
        .then(function (res) {
            if (!res.ok) {
                return res.text().then(function (body) {
                    throw new Error('Save failed: ' + res.status + ' ' + body);
                });
            }
            return res.json();
        })
        .then(function (data) {
            setStatus('Saved — you can close this tab.', 'deploying');
            showSavedBadge(blockId);
            startDeployCheck(data.deploy_id, blockId);
        })
        .catch(function (err) {
            console.error('[edit.js] Save error:', err);
            setStatus('Couldn\'t save — please try again, or reload if it keeps failing.', 'error');
            setPending(blockId, false);
        });
    }

    function saveViaDB(blockId, newText) {
        // Phase 2 — not implemented in phase 1
        console.warn('[edit.js] DB stack not implemented in phase 1');
        setStatus('DB stack not available.', 'error');
        setPending(blockId, false);
    }

    function startDeployCheck(deployId, blockId) {
        _deployCheckCount = 0;
        clearInterval(_deployCheckInterval);

        _deployCheckInterval = setInterval(function () {
            _deployCheckCount++;
            if (_deployCheckCount > DEPLOY_CHECK_MAX) {
                clearInterval(_deployCheckInterval);
                // Save is already committed + pushed; we just couldn't confirm
                // the redeploy finished in 2 minutes. Keep state blue (not red).
                setStatus('Saved. Still publishing — it should appear within a minute.', 'deploying');
                setPending(blockId, false);
                return;
            }

            // Poll git-edit-server for deploy status
            fetch(GIT_EDIT_SERVER + '/status?deploy_id=' + encodeURIComponent(deployId || ''))
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.status === 'live') {
                        clearInterval(_deployCheckInterval);
                        setStatus('Deployed — LIVE.', 'live');
                        setPending(blockId, false);
                    } else if (data.status === 'error') {
                        clearInterval(_deployCheckInterval);
                        setStatus('Publish failed: ' + (data.message || 'unknown error'), 'error');
                        setPending(blockId, false);
                    }
                    // Still deploying — continue polling
                })
                .catch(function () {
                    // Network error during poll — just continue
                });
        }, 5000);
    }

    // ── Initialisation ────────────────────────────────────────────────────────

    function init() {
        validateToken(tokenValue).then(function (record) {
            if (!record) {
                // Token invalid — silent exit, site stays read-only
                console.warn('[edit.js] Invalid or expired token — edit mode not activated.');
                return;
            }

            _validatedToken = record;
            injectStyles();
            createStatusBar();
            activateBlocks();
        });
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
