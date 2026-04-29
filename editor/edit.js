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

    function showDesktopOnlyBanner() {
        if (document.getElementById('edit-desktop-only-banner')) return; // idempotent
        var banner = document.createElement('div');
        banner.id = 'edit-desktop-only-banner';
        banner.setAttribute('role', 'alert');
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
    }

    var desktopMQ = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
    var desktopOK = desktopMQ && desktopMQ.matches;

    if (!desktopOK) {
        showDesktopOnlyBanner();
        return;
    }

    // Re-evaluate if input device changes mid-session (e.g. iPad trackpad
    // unplugged, or window dragged between touch + non-touch monitors).
    if (desktopMQ && desktopMQ.addEventListener) {
        desktopMQ.addEventListener('change', function (e) {
            if (!e.matches) {
                // Lock every editable block and show the banner.
                document.querySelectorAll('.edit-block').forEach(function (b) {
                    b.setAttribute('contenteditable', 'false');
                });
                showDesktopOnlyBanner();
            }
        });
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

    // Tracks the most recent successful save (for the Undo button).
    // Cleared after Undo fires, replaced after each new save.
    var _lastSavedBlock = null;

    function refreshActionButtons() {
        var undoBtn = document.getElementById('edit-undo-btn');
        var resetBtn = document.getElementById('edit-reset-all-btn');
        if (undoBtn) {
            undoBtn.hidden = !_lastSavedBlock;
        }
        if (resetBtn) {
            // Reset-all visible while any block diverges from its original.
            var anyEdited = Object.keys(_pendingBlocks).some(function (id) {
                return _pendingBlocks[id].current !== _pendingBlocks[id].original;
            });
            resetBtn.hidden = !anyEdited;
        }
    }

    function createStatusBar() {
        var bar = document.createElement('div');
        bar.id = 'edit-status-bar';
        bar.setAttribute('aria-live', 'polite');
        bar.setAttribute('role', 'status');
        bar.innerHTML =
            '<span id="edit-mode-label">Edit mode</span>' +
            '<span id="edit-status-text"></span>' +
            '<button id="edit-undo-btn" title="Revert the last save back to its original text" hidden>Undo</button>' +
            '<button id="edit-reset-all-btn" title="Revert every edit made this session back to original" hidden>Reset all</button>' +
            '<button id="edit-exit-btn" title="Exit edit mode">Exit</button>';
        document.body.appendChild(bar);

        document.getElementById('edit-undo-btn').addEventListener('click', function () {
            if (!_lastSavedBlock) return;
            var bid = _lastSavedBlock.blockId;
            var originalText = _lastSavedBlock.originalText;
            var el = blockEl(bid);
            if (el) el.innerText = originalText;
            // Clear the marker so the next save replaces it (and so the
            // Undo button hides until the next successful save).
            _lastSavedBlock = null;
            refreshActionButtons();
            saveBlock(bid, originalText);
        });

        document.getElementById('edit-reset-all-btn').addEventListener('click', function () {
            var dirty = Object.keys(_pendingBlocks).filter(function (id) {
                return _pendingBlocks[id].current !== _pendingBlocks[id].original;
            });
            if (!dirty.length) return;
            if (!window.confirm('Revert all ' + dirty.length + ' edit' + (dirty.length === 1 ? '' : 's') + ' from this session back to original?')) return;
            _lastSavedBlock = null;
            refreshActionButtons();
            dirty.forEach(function (bid) {
                var el = blockEl(bid);
                var originalText = _pendingBlocks[bid].original;
                if (el) el.innerText = originalText;
                saveBlock(bid, originalText);
            });
        });

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
            // Skip blocks with nested markup — text-only editor would destroy
            // inline <a>/<strong>/<em> on save. Tier-3 (inline preservation)
            // is a separate plan; until then, non-leaf blocks are not editable.
            if (block.children.length > 0) return;

            var blockId = block.getAttribute('data-edit-id');
            var original = block.innerText;
            _pendingBlocks[blockId] = { original: original, current: original };

            block.setAttribute('contenteditable', 'true');
            block.setAttribute('spellcheck', 'true');
            block.classList.add('edit-block');

            // Save on blur. Do NOT promote `.current` here — only on 2xx from
            // the server. Optimistic promotion here would desync on a failed
            // save: retry-on-blur silently no-ops because "no change".
            block.addEventListener('blur', function () {
                var newText = block.innerText.trim();
                if (newText === _pendingBlocks[blockId].current) return;
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

    // Per-deploy poll state. Rapid edits used to clobber each other's polls
    // (single global interval). Now each deploy_id gets its own watch so
    // block A's outline clears when A's deploy goes live even if B has fired.
    var _deployWatches = {}; // deployId -> { intervalId, count, blockId, newText, networkFails, savedShown }
    var DEPLOY_POLL_INTERVAL = 5000;   // 5s
    var DEPLOY_CHECK_MAX = 24;          // 24 * 5s = 120s fast window
    var MAX_CONCURRENT_WATCHES = 5;
    var NETWORK_FAIL_THRESHOLD = 3;

    function blockEl(blockId) {
        var sel = window.CSS && CSS.escape ? CSS.escape(blockId) : blockId;
        return document.querySelector('[data-edit-id="' + sel + '"]');
    }

    function setPending(blockId, on) {
        var el = blockEl(blockId);
        if (!el) return;
        el.classList.toggle('edit-block--pending', !!on);
        // Lock the block while its save is in flight. Prevents the Escape-
        // during-save race (where Escape would revert DOM while server has
        // accepted the intermediate text).
        el.setAttribute('contenteditable', on ? 'false' : 'true');
    }

    function showSavedBadge(blockId) {
        var el = blockEl(blockId);
        if (!el) return;
        var existing = el.querySelector('.edit-block__saved-badge');
        if (existing) existing.remove();
        var badge = document.createElement('span');
        badge.className = 'edit-block__saved-badge';
        badge.textContent = '✓ Saved';
        badge.setAttribute('aria-hidden', 'true');
        // Position: flip to bottom if block is near the top of the viewport,
        // otherwise hero/h1 badges clip off-screen.
        if (el.getBoundingClientRect().top < 40) {
            badge.style.top = 'auto';
            badge.style.bottom = '-28px';
        }
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
            // Don't promote to "Saved" yet — 202 means queued, not yet
            // committed+pushed. Bar stays orange ("Saving your change…")
            // until the first poll reports status `deploying` (post-push).
            startDeployCheck(data.deploy_id, blockId, newText);
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

    function stopDeployWatch(deployId) {
        var watch = _deployWatches[deployId];
        if (!watch) return;
        clearInterval(watch.intervalId);
        delete _deployWatches[deployId];
    }

    function startDeployCheck(deployId, blockId, newText) {
        // Evict the oldest watch if we're at capacity (defensive — caps
        // runaway click scenarios from spinning up unbounded polls).
        var ids = Object.keys(_deployWatches);
        if (ids.length >= MAX_CONCURRENT_WATCHES) {
            var evicted = _deployWatches[ids[0]];
            stopDeployWatch(ids[0]);
            // Don't leave the evicted block stuck amber — unlock it.
            if (evicted && evicted.blockId) setPending(evicted.blockId, false);
        }

        var watch = {
            intervalId: null,
            count: 0,
            blockId: blockId,
            newText: newText,
            networkFails: 0,
            savedShown: false
        };
        _deployWatches[deployId] = watch;

        watch.intervalId = setInterval(function () {
            watch.count++;

            if (watch.count > DEPLOY_CHECK_MAX) {
                // 120s fast-poll window elapsed. Clear the pending outline
                // (so the block isn't stuck amber forever). Keep the status
                // green + honest: change may still be publishing server-side.
                stopDeployWatch(deployId);
                setPending(watch.blockId, false);
                if (!watch.savedShown) {
                    // Server never confirmed commit+push within 2 min.
                    setStatus('Your change is taking longer than usual. Try again if it doesn\'t appear soon.', 'error');
                } else {
                    setStatus('Saved. Still publishing — check back in a minute.', 'deploying');
                }
                return;
            }

            fetch(GIT_EDIT_SERVER + '/status?deploy_id=' + encodeURIComponent(deployId || ''))
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    watch.networkFails = 0;
                    var status = data.status;

                    if (status === 'live') {
                        stopDeployWatch(deployId);
                        // If we skipped straight from queued to live (very fast
                        // deploy), the green "Saved" success message hadn't shown
                        // yet — flash it briefly before the LIVE message lands so
                        // the user always sees an explicit success state.
                        if (!watch.savedShown) {
                            var originalText = _pendingBlocks[watch.blockId].original;
                            _pendingBlocks[watch.blockId].current = watch.newText;
                            showSavedBadge(watch.blockId);
                            watch.savedShown = true;
                            _lastSavedBlock = { blockId: watch.blockId, originalText: originalText };
                            refreshActionButtons();
                            setPending(watch.blockId, false);
                            if (Object.keys(_deployWatches).length === 0) {
                                setStatus('Saved — you can close this tab.', 'deploying');
                                setTimeout(function () {
                                    if (Object.keys(_deployWatches).length === 0) {
                                        setStatus('Deployed — LIVE.', 'live');
                                    }
                                }, 1500);
                            }
                            return;
                        }
                        // Only show LIVE status if no other deploys are still
                        // in flight — otherwise their "Saved" message wins.
                        if (Object.keys(_deployWatches).length === 0) {
                            setStatus('Deployed — LIVE.', 'live');
                        }
                        setPending(watch.blockId, false);
                    } else if (status === 'error') {
                        stopDeployWatch(deployId);
                        setStatus('Publish failed: ' + (data.message || 'unknown error'), 'error');
                        setPending(watch.blockId, false);
                    } else if (status === 'deploying' && !watch.savedShown) {
                        // First confirmation that commit+push succeeded.
                        // NOW it's honest to claim "Saved".
                        watch.savedShown = true;
                        var origText = _pendingBlocks[watch.blockId].original;
                        _pendingBlocks[watch.blockId].current = watch.newText;
                        showSavedBadge(watch.blockId);
                        _lastSavedBlock = { blockId: watch.blockId, originalText: origText };
                        refreshActionButtons();
                        setPending(watch.blockId, false);
                        setStatus('Saved — you can close this tab.', 'deploying');
                    }
                    // queued/cloning/editing/committing → keep polling,
                    // bar stays orange ("Saving your change…")
                })
                .catch(function () {
                    watch.networkFails++;
                    if (watch.networkFails >= NETWORK_FAIL_THRESHOLD) {
                        stopDeployWatch(deployId);
                        setStatus('You look offline — your change was sent. Reload when you\'re back online to verify.', 'error');
                        // Leave pending outline ON — we genuinely don't know
                        // server-side status. Reload is the right recovery.
                    }
                });
        }, DEPLOY_POLL_INTERVAL);
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
