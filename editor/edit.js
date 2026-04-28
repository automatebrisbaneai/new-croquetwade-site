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

    // ── URL Param Detection ──────────────────────────────────────────────────

    var params = new URLSearchParams(window.location.search);
    var hasEditMode = params.has('edit');
    var tokenValue = params.get('t') || null;

    // Exit immediately if not in edit mode — zero page impact
    if (!hasEditMode || !tokenValue) {
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

            // Prevent Enter from creating <div> in contenteditable
            block.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    block.blur();
                }
            });
        });

        setStatus('Click any highlighted text to edit.', 'idle');
    }

    // ── Save Logic ───────────────────────────────────────────────────────────

    var _deployCheckInterval = null;
    var _deployCheckCount = 0;
    var DEPLOY_CHECK_MAX = 24; // 24 * 5s = 120s max

    function saveBlock(blockId, newText) {
        setStatus('Saving...', 'saving');

        if (STACK === 'git') {
            saveViaGit(blockId, newText);
        } else {
            saveViaDB(blockId, newText);
        }
    }

    function saveViaGit(blockId, newText) {
        fetch(GIT_EDIT_SERVER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: tokenValue,
                site: SITE,
                block_id: blockId,
                new_text: newText
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
            setStatus('Deploying... (~60s)', 'deploying');
            startDeployCheck(data.deploy_id);
        })
        .catch(function (err) {
            console.error('[edit.js] Save error:', err);
            setStatus('Save failed. Check console.', 'error');
        });
    }

    function saveViaDB(blockId, newText) {
        // Phase 2 — not implemented in phase 1
        console.warn('[edit.js] DB stack not implemented in phase 1');
        setStatus('DB stack not available.', 'error');
    }

    function startDeployCheck(deployId) {
        _deployCheckCount = 0;
        clearInterval(_deployCheckInterval);

        _deployCheckInterval = setInterval(function () {
            _deployCheckCount++;
            if (_deployCheckCount > DEPLOY_CHECK_MAX) {
                clearInterval(_deployCheckInterval);
                setStatus('Deploy check timed out. Try reloading.', 'error');
                return;
            }

            // Poll git-edit-server for deploy status
            fetch(GIT_EDIT_SERVER + '/status?deploy_id=' + encodeURIComponent(deployId || ''))
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.status === 'live') {
                        clearInterval(_deployCheckInterval);
                        setStatus('Live! Reload to see change.', 'live');
                    } else if (data.status === 'error') {
                        clearInterval(_deployCheckInterval);
                        setStatus('Deploy failed: ' + (data.message || 'unknown error'), 'error');
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
