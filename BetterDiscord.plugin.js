/**
 * @name QuestAutoComplete
 * @author manolo_kat
 * @description Auto-complete Discord quests with one click
 * @version 1.0.0
 * @authorId 823310792291385424
 * @website https://github.com/Manolo-Kat/Discord_Quest_Auto-Complete
 * @source https://github.com/Manolo-Kat/Discord_Quest_Auto-Complete
 * @updateUrl https://raw.githubusercontent.com/Manolo-Kat/Discord_Quest_Auto-Complete/main/BetterDiscord.plugin.js
 */

module.exports = (() => {
    const config = {
        info: {
            name: "QuestAutoComplete",
            authors: [{
                name: "manolo_kat",
                discord_id: "823310792291385424",
                github_username: "Manolo-Kat"
            }],
            version: "1.0.0",
            description: "Auto-complete Discord quests with one click",
            github: "https://github.com/Manolo-Kat/Discord_Quest_Auto-Complete",
            github_raw: "https://raw.githubusercontent.com/Manolo-Kat/discord_quests_script_tampermonkey/main/QuestAutoComplete.plugin.js"
        },
        changelog: [{
            title: "Initial Release",
            type: "added",
            items: [
                "Added one-click quest completion button",
                "Auto-complete all enrolled quests simultaneously",
                "Support for all quest types (VIDEO, PLAY, STREAM, ACTIVITY)"
            ]
        }]
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        getName() { return config.info.name; }
        getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
        getDescription() { return config.info.description; }
        getVersion() { return config.info.version; }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() { }
        stop() { }
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
            const { Patcher, WebpackModules, DiscordModules, Utilities } = Library;
            const { React } = DiscordModules;

            return class QuestAutoComplete extends Plugin {
                constructor() {
                    super();
                    this.buttonElement = null;
                    this.isRunning = false;
                }

                onStart() {
                    BdApi.showToast("Quest Auto-Complete loaded!", { type: "success" });
                    this.injectButton();
                    this.observeNavigation();
                }

                onStop() {
                    this.removeButton();
                    BdApi.showToast("Quest Auto-Complete unloaded!", { type: "info" });
                }

                observeNavigation() {
                    // Watch for URL changes
                    let lastUrl = location.href;
                    this.navigationObserver = new MutationObserver(() => {
                        const url = location.href;
                        if (url !== lastUrl) {
                            lastUrl = url;
                            this.removeButton();
                            setTimeout(() => this.injectButton(), 1000);
                        }
                    });
                    this.navigationObserver.observe(document.body, { subtree: true, childList: true });
                }

                injectButton() {
                    if (this.buttonElement) return;

                    const button = document.createElement('button');
                    button.id = 'quest-auto-complete-btn';
                    button.textContent = 'Start Completing Quests';
                    button.className = 'quest-auto-complete-button';
                    
                    button.style.cssText = `
                        position: fixed;
                        top: 80px;
                        right: 20px;
                        z-index: 9999;
                        background-color: #5865F2;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 12px 24px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 2px 10px rgba(88, 101, 242, 0.3);
                        transition: all 0.2s ease;
                        font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    `;

                    button.onmouseenter = () => {
                        if (!this.isRunning) {
                            button.style.backgroundColor = '#4752C4';
                            button.style.transform = 'translateY(-1px)';
                            button.style.boxShadow = '0 4px 12px rgba(88, 101, 242, 0.4)';
                        }
                    };

                    button.onmouseleave = () => {
                        if (!this.isRunning) {
                            button.style.backgroundColor = '#5865F2';
                            button.style.transform = 'translateY(0)';
                            button.style.boxShadow = '0 2px 10px rgba(88, 101, 242, 0.3)';
                        }
                    };

                    button.onclick = () => {
                        if (!this.isRunning) {
                            this.isRunning = true;
                            button.disabled = true;
                            button.textContent = 'Processing...';
                            button.style.backgroundColor = '#4752C4';
                            this.runQuestAutomation(button);
                        }
                    };

                    document.body.appendChild(button);
                    this.buttonElement = button;
                }

                removeButton() {
                    if (this.buttonElement) {
                        this.buttonElement.remove();
                        this.buttonElement = null;
                    }
                    if (this.navigationObserver) {
                        this.navigationObserver.disconnect();
                    }
                }

                resetButton(button) {
                    this.isRunning = false;
                    if (button) {
                        button.disabled = false;
                        button.textContent = 'Start Completing Quests';
                        button.style.backgroundColor = '#5865F2';
                    }
                }

                async runQuestAutomation(button) {
                    try {
                        delete window.$;
                        let wpRequire = window.webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                        window.webpackChunkdiscord_app.pop();

                        // Store references
                        let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
                        let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP;
                        let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
                        let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z;
                        let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP;
                        let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z;
                        let api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn;

                        if (!ApplicationStreamingStore || !RunningGameStore || !QuestsStore || !ChannelStore || !GuildChannelStore || !FluxDispatcher || !api) {
                            BdApi.showToast("Failed to find required Discord stores. Please refresh and try again.", { type: "error" });
                            this.resetButton(button);
                            return;
                        }

                        const CONFIG = {
                            VIDEO_SPEED: 7,
                            VIDEO_INTERVAL: 1000,
                            MAX_FUTURE: 10,
                            HEARTBEAT_INTERVAL: 20000,
                            JITTER_MAX: 3000,
                            RETRY_ATTEMPTS: 3,
                            RETRY_DELAY: 2000
                        };

                        const log = (msg, type = 'info') => {
                            const timestamp = new Date().toLocaleTimeString();
                            const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
                            console.log(`[${timestamp}] ${prefix} ${msg}`);
                        };

                        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                        const addJitter = (ms) => ms + Math.random() * CONFIG.JITTER_MAX;

                        const retryAsync = async (fn, attempts = CONFIG.RETRY_ATTEMPTS) => {
                            for (let i = 0; i < attempts; i++) {
                                try {
                                    return await fn();
                                } catch (error) {
                                    if (i === attempts - 1) throw error;
                                    log(`Retry ${i + 1}/${attempts} after error: ${error.message}`, 'warn');
                                    await sleep(CONFIG.RETRY_DELAY * (i + 1));
                                }
                            }
                        };

                        let activeQuests = [...QuestsStore.quests.values()].filter(x =>
                            x.id !== "1412491570820812933" &&
                            x.userStatus?.enrolledAt != null &&
                            x.userStatus?.claimedAt == null &&
                            x.userStatus?.completedAt == null &&
                            new Date(x.config.expiresAt).getTime() > Date.now()
                        );

                        let isApp = typeof DiscordNative !== "undefined";

                        if (activeQuests.length === 0) {
                            BdApi.showToast("No enrolled/uncompleted quests found!", { type: "info" });
                            this.resetButton(button);
                            return;
                        }

                        log(`Found ${activeQuests.length} enrolled quest(s). Starting simultaneous execution...`);
                        activeQuests.forEach(q => log(`  • ${q.config.messages.questName}`));
                        BdApi.showToast(`Starting ${activeQuests.length} quest(s)...`, { type: "info" });

                        const activeListeners = new Map();
                        const activeFakeGames = new Map();
                        let streamQuestCount = 0;

                        const handlers = {
                            WATCH_VIDEO: async (quest, taskConfig) => {
                                const taskName = taskConfig.tasks.WATCH_VIDEO ? 'WATCH_VIDEO' : 'WATCH_VIDEO_ON_MOBILE';
                                const secondsNeeded = taskConfig.tasks[taskName].target;
                                let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
                                const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();

                                log(`[${quest.config.messages.questName}] Starting video watch (${secondsDone}/${secondsNeeded}s)`);

                                while (secondsDone < secondsNeeded) {
                                    const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + CONFIG.MAX_FUTURE;
                                    const diff = maxAllowed - secondsDone;

                                    if (diff >= CONFIG.VIDEO_SPEED) {
                                        const timestamp = Math.min(secondsNeeded, secondsDone + CONFIG.VIDEO_SPEED + Math.random());
                                        const res = await retryAsync(() =>
                                            api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp}})
                                        );

                                        secondsDone = Math.min(secondsNeeded, timestamp);
                                        const progress = Math.round((secondsDone / secondsNeeded) * 100);
                                        log(`[${quest.config.messages.questName}] Progress: ${progress}% (${secondsDone}/${secondsNeeded}s)`);

                                        if (res.body.completed_at != null) break;
                                    }
                                    await sleep(CONFIG.VIDEO_INTERVAL);
                                }
                                log(`[${quest.config.messages.questName}] Completed!`, 'success');
                            },

                            WATCH_VIDEO_ON_MOBILE: async (quest, taskConfig) => {
                                return handlers.WATCH_VIDEO(quest, taskConfig);
                            },

                            PLAY_ON_DESKTOP: async (quest, taskConfig) => {
                                if (!isApp) {
                                    log(`[${quest.config.messages.questName}] Requires desktop app - skipping`, 'error');
                                    return;
                                }

                                const applicationId = quest.config.application.id;
                                const applicationName = quest.config.application.name;
                                const secondsNeeded = taskConfig.tasks.PLAY_ON_DESKTOP.target;
                                const secondsDone = quest.userStatus?.progress?.PLAY_ON_DESKTOP?.value ?? 0;
                                const pid = Math.floor(Math.random() * 30000) + 1000;

                                log(`[${quest.config.messages.questName}] Spoofing game: ${applicationName}`);

                                const res = await retryAsync(() =>
                                    api.get({url: `/applications/public?application_ids=${applicationId}`})
                                );

                                if (!res.body || res.body.length === 0) {
                                    log(`[${quest.config.messages.questName}] Failed to fetch application data`, 'error');
                                    return;
                                }

                                const appData = res.body[0];
                                const executable = appData.executables?.find(x => x.os === "win32");

                                if (!executable) {
                                    log(`[${quest.config.messages.questName}] No Windows executable found`, 'error');
                                    return;
                                }

                                const exeName = executable.name.replace(">", "");

                                const fakeGame = {
                                    cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                                    exeName,
                                    exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                                    hidden: false,
                                    isLauncher: false,
                                    id: applicationId,
                                    name: appData.name,
                                    pid,
                                    pidPath: [pid],
                                    processName: appData.name,
                                    start: Date.now(),
                                };

                                const realGetRunningGames = RunningGameStore.getRunningGames;
                                const realGetGameForPID = RunningGameStore.getGameForPID;

                                activeFakeGames.set(quest.id, fakeGame);

                                RunningGameStore.getRunningGames = () => {
                                    const current = Array.from(activeFakeGames.values());
                                    return [...realGetRunningGames.call(RunningGameStore), ...current];
                                };

                                RunningGameStore.getGameForPID = (p) => {
                                    const fake = Array.from(activeFakeGames.values()).find(g => g.pid === p);
                                    if (fake) return fake;
                                    return realGetGameForPID.call(RunningGameStore, p);
                                };

                                FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [], added: [fakeGame], games: RunningGameStore.getRunningGames()});

                                return new Promise((resolve) => {
                                    const fn = (data) => {
                                        if (data.quest?.id !== quest.id) return;

                                        const progress = quest.config.configVersion === 1
                                            ? data.userStatus.streamProgressSeconds
                                            : Math.floor(data.userStatus.progress?.PLAY_ON_DESKTOP?.value ?? 0);

                                        const percentage = Math.round((progress / secondsNeeded) * 100);
                                        log(`[${quest.config.messages.questName}] Progress: ${percentage}% (${progress}/${secondsNeeded}s)`);

                                        if (progress >= secondsNeeded) {
                                            log(`[${quest.config.messages.questName}] Completed!`, 'success');

                                            activeFakeGames.delete(quest.id);

                                            if (activeFakeGames.size === 0) {
                                                RunningGameStore.getRunningGames = realGetRunningGames;
                                                RunningGameStore.getGameForPID = realGetGameForPID;
                                            }

                                            FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: RunningGameStore.getRunningGames()});
                                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                            activeListeners.delete(quest.id);
                                            resolve();
                                        }
                                    };

                                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                    activeListeners.set(quest.id, fn);
                                    log(`[${quest.config.messages.questName}] Estimated time: ~${Math.ceil((secondsNeeded - secondsDone) / 60)} minutes`);
                                });
                            },

                            STREAM_ON_DESKTOP: async (quest, taskConfig) => {
                                if (!isApp) {
                                    log(`[${quest.config.messages.questName}] Requires desktop app - skipping`, 'error');
                                    return;
                                }

                                const applicationId = quest.config.application.id;
                                const applicationName = quest.config.application.name;
                                const secondsNeeded = taskConfig.tasks.STREAM_ON_DESKTOP.target;
                                const secondsDone = quest.userStatus?.progress?.STREAM_ON_DESKTOP?.value ?? 0;
                                const pid = Math.floor(Math.random() * 30000) + 1000;

                                log(`[${quest.config.messages.questName}] Spoofing stream: ${applicationName}`);
                                log(`[${quest.config.messages.questName}] Remember: Need at least 1 other person in VC!`, 'warn');

                                const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                                streamQuestCount++;

                                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                                    id: applicationId,
                                    pid,
                                    sourceName: null
                                });

                                return new Promise((resolve) => {
                                    const fn = (data) => {
                                        if (data.quest?.id !== quest.id) return;

                                        const progress = quest.config.configVersion === 1
                                            ? data.userStatus.streamProgressSeconds
                                            : Math.floor(data.userStatus.progress?.STREAM_ON_DESKTOP?.value ?? 0);

                                        const percentage = Math.round((progress / secondsNeeded) * 100);
                                        log(`[${quest.config.messages.questName}] Progress: ${percentage}% (${progress}/${secondsNeeded}s)`);

                                        if (progress >= secondsNeeded) {
                                            log(`[${quest.config.messages.questName}] Completed!`, 'success');

                                            streamQuestCount--;
                                            if (streamQuestCount === 0) {
                                                ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                                            }

                                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                            activeListeners.delete(quest.id);
                                            resolve();
                                        }
                                    };

                                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                    activeListeners.set(quest.id, fn);
                                    log(`[${quest.config.messages.questName}] Estimated time: ~${Math.ceil((secondsNeeded - secondsDone) / 60)} minutes`);
                                });
                            },

                            PLAY_ACTIVITY: async (quest, taskConfig) => {
                                const secondsNeeded = taskConfig.tasks.PLAY_ACTIVITY.target;
                                const questName = quest.config.messages.questName;

                                log(`[${questName}] Starting activity play`);

                                const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ??
                                    Object.values(GuildChannelStore.getAllGuilds()).find(x => x?.VOCAL?.length > 0)?.VOCAL?.[0]?.channel?.id;

                                if (!channelId) {
                                    log(`[${questName}] No suitable channel found - skipping`, 'error');
                                    return;
                                }

                                const streamKey = `call:${channelId}:1`;

                                while (true) {
                                    const res = await retryAsync(() =>
                                        api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
                                    );

                                    const progress = res.body.progress?.PLAY_ACTIVITY?.value ?? 0;
                                    const percentage = Math.round((progress / secondsNeeded) * 100);
                                    log(`[${questName}] Progress: ${percentage}% (${progress}/${secondsNeeded}s)`);

                                    if (progress >= secondsNeeded) {
                                        await retryAsync(() =>
                                            api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
                                        );
                                        break;
                                    }

                                    await sleep(addJitter(CONFIG.HEARTBEAT_INTERVAL));
                                }

                                log(`[${questName}] Completed!`, 'success');
                            }
                        };

                        async function completeQuest(quest) {
                            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
                            const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
                                .find(x => taskConfig.tasks[x] != null);

                            if (!taskName || !handlers[taskName]) {
                                log(`[${quest.config.messages.questName}] Unknown task type: ${taskName}`, 'error');
                                return;
                            }

                            try {
                                await handlers[taskName](quest, taskConfig);
                            } catch (error) {
                                log(`[${quest.config.messages.questName}] Failed: ${error.message}`, 'error');
                                console.error(error);
                            }
                        }

                        Promise.all(activeQuests.map(quest => completeQuest(quest)))
                            .then(() => {
                                log("All quests completed!", 'success');

                                activeListeners.forEach((fn) => {
                                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                                });
                                activeListeners.clear();
                                activeFakeGames.clear();

                                log("Script execution finished. All resources cleaned up.", 'success');
                                
                                BdApi.showToast("All quests completed!", { type: "success" });
                                
                                if (button) {
                                    button.textContent = '✓ Completed!';
                                    button.style.backgroundColor = '#3BA55D';
                                    setTimeout(() => this.resetButton(button), 3000);
                                }
                            })
                            .catch(error => {
                                log(`Critical error: ${error.message}`, 'error');
                                console.error(error);
                                BdApi.showToast("Quest automation failed! Check console.", { type: "error" });
                                this.resetButton(button);
                            });

                    } catch (error) {
                        console.error("Failed to run quest automation:", error);
                        BdApi.showToast("Failed to run automation. Check console for details.", { type: "error" });
                        this.resetButton(button);
                    }
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();


