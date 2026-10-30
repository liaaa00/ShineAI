export interface DevelopmentRuntimeInfo {
  version: string;
  release: string;
  edition: 'local-development';
  officialMembership: false;
  officialCloud: 'removed';
  electron: string;
  node: string;
  abi: string;
  userData: string;
  ports: { localAuth: null; meeting: null };
}
export interface AppearanceTextConfig {
  enabled:boolean; color:string|null; outlineWidth:number; outlineOpacity:number; outlineColor:string;
}
export interface AppearanceThemeConfig {
  strength:number; mask:number; transparency:number; blur:number; panelBlur:number; text:AppearanceTextConfig;
}
export interface AppearanceConfig {
  version:1; enabled:boolean; media:string|null; fit:'cover'|'contain'; positionX:number; positionY:number; motion:boolean;
  light: AppearanceThemeConfig;
  dark: AppearanceThemeConfig;
}
export interface AppearanceMedia {id:string;name:string;type:string;url:string;size:number}
export interface PetPersona {name:string;avatarType:'cat'|'dog'|'fox'|'owl'|'robot'|'custom';personality:'formal'|'casual'|'cute';petSpecies?:string;customAvatarId?:string|null}
export interface AppearanceResult {success:boolean;error?:string;canceled?:boolean;config?:AppearanceConfig;media?:AppearanceMedia|null}
export interface StartupConfig {version:1;enabled:boolean;frequency:'always'|'daily';theme:'system'|'light'|'dark';duration:'short'|'cinematic';music:'silent'|'preview'|'local';volume:number;audioId:string|null}
export interface RunningInput {id:string;revision:number;text:string;state:'dispatching'|'queued'|'submitted'|'sent'|'failed'|'interrupted'|'cancelled'|'restored'|'dismissed';transport:'unknown'|'native-api'|'sdk';createdAt:string;sentAt?:string;cancelledAt?:string;resolvedAt?:string;error?:string;canCancel:boolean;cancelReason:'local_queue'|'cancelled'|'sent'|'handoff_unconfirmed'|'not_in_queue'}
export interface InputFlowState {sessionId:string;revision:number;requiredRevision:number;reviewedRevision:number;requestRevision:number;version:number;inputs:RunningInput[]}
export interface StartupResult {success:boolean;error?:string;canceled?:boolean;config?:StartupConfig;audio?:AppearanceMedia|null;previewUrl?:string;facts?:{version:string;profile:string;sandbox:string;platform:string}}
/** window.shineAI.registry.fetchLeaderboard accepts these optional refresh preferences. */
export interface SkillLeaderboardOptions {force?:boolean}
export interface SkillLeaderboardResult {
  success:boolean;data:Array<{source:string;skillId:string;name:string;installs?:number}>;
  fetchedAt:number|null;stale:boolean;error?:string;errorCode?:string;
}

/** Additional, narrow methods exposed on window.shineAI by the local 1.0.8 import. */
export interface Local108Result<T> {ok:boolean;data?:T;error?:string}
export interface WebLlmSite {id:string;name:string;url:string;host:string;enabled:boolean;isDefault?:boolean;status:string;source:string;maxChars?:number;overrides?:Record<string,string|null>}
export interface WebLlmSnapshot {enabled:boolean;riskAcknowledgedAt?:string;sites:WebLlmSite[];presets:Array<{id:string;name:string;url:string}>;sensitiveAllowlist:string[];browserAvailable:boolean}
export interface WebLlmBridge {
  list():Promise<WebLlmSnapshot>;
  saveSite(input:Partial<WebLlmSite>&{presetId?:string}):Promise<{ok:boolean;site?:WebLlmSite;snapshot?:WebLlmSnapshot;error?:string}>;
  deleteSite(siteId:string):Promise<{ok:boolean;snapshot?:WebLlmSnapshot;error?:string}>;
  setDefault(siteId:string):Promise<{ok:boolean;snapshot?:WebLlmSnapshot;error?:string}>;
  setEnabled(input:{enabled:boolean;riskAcknowledged?:boolean}):Promise<{ok:boolean;snapshot?:WebLlmSnapshot;error?:string}>;
  setSensitiveAllowlist(paths:string[]):Promise<{ok:boolean;snapshot?:WebLlmSnapshot;error?:string}>;
  test(siteId:string):Promise<{ok:boolean;error?:string}>;
  openLogin(siteId:string):Promise<{ok:boolean;error?:string}>;
  stopLoginWatch(siteId:string):Promise<{ok:boolean}>;
  pick(siteId:string,field:string):Promise<{ok:boolean;selector?:string;error?:string}>;
  refreshPresets():Promise<WebLlmSnapshot>;
  onProgress(callback:(event:Record<string,unknown>)=>void):()=>void;
}
export interface DailyBoardItem {id?:string;sessionId?:string;title:string;summary:string;status:'done'|'doing'|'wait';laneKey:string;laneName?:string}
export interface DailyBoardDay {date:string;hasSnapshot:boolean;items:DailyBoardItem[];lanes:Array<{key:string;name:string}>;generating:boolean;modelAssigned:boolean}
export interface DailyBoardBridge {
  getDay(date:string):Promise<Local108Result<DailyBoardDay>>;
  generate(date:string):Promise<Local108Result<{day:DailyBoardDay;run:{id:string;status:string}}>>;
  listRunDates(from:string,to:string):Promise<Local108Result<string[]>>;
  getSettings():Promise<Local108Result<Record<string,unknown>>>;
  setSettings(settings:Record<string,unknown>):Promise<Local108Result<Record<string,unknown>>>;
  getScheduleStatus():Promise<Local108Result<Record<string,unknown>>>;
  getChannelAvailability():Promise<Local108Result<Array<{channel:string;available:boolean;reason?:string}>>>;
  export(input:{date:string;format:'html'|'png'|'pdf';hideLocalPaths?:boolean}):Promise<Local108Result<{filePaths:string[]}>>;
  model(input?:{providerId:string;model:string}):Promise<{ok:boolean;providerId:string;model:string;fallbackProviderId:string;error?:string}>;
  editItem(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  moveLane(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  merge(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  split(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  addEntry(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  updateEntry(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  deleteEntry(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  resolveAiConflict(input:Record<string,unknown>):Promise<Local108Result<DailyBoardDay>>;
  cancelRefine(input:{date:string}):Promise<Local108Result<{canceled:boolean}>>;
  cleanupRuns(input:{olderThanDays:number}):Promise<Local108Result<{deleted:number}>>;
  onUpdated(callback:(event:{date:string})=>void):()=>void;
  onProgress(callback:(event:Record<string,unknown>)=>void):()=>void;
  onScheduledReady(callback:(event:{date:string})=>void):()=>void;
}
export interface Local108BridgeAdditions {
  dailyBoard:DailyBoardBridge;webLlm:WebLlmBridge;
  workspace:{reorder(ids:string[]):Promise<{success:boolean;error?:string}>};
  browser:{importCookies(options?:{scope:'shared'|'web-llm'}):Promise<{ok:boolean;canceled?:boolean;parsed?:number;imported?:number;skipped?:number;error?:string}>;pageContext(tabId?:string):Promise<{ok:boolean;title?:string;url?:string;text?:string;error?:string}>};
}
declare global {
  interface Window {
    development: {
      pet: {
        importImage():Promise<{success:boolean;canceled?:boolean;error?:string;media?:AppearanceMedia}>;
        discardImage(id:string):Promise<{success:boolean;error?:string}>;
        onPersonaChanged(callback:(persona:PetPersona)=>void):()=>void;
      };
      inputFlow: {
        get(sessionId:string):Promise<InputFlowState>;
        cancel(sessionId:string,inputId:string):Promise<{success:boolean;removed:boolean;text?:string;inputId?:string;reason?:string;error?:string}>;
        resolve(sessionId:string,inputId:string,action:'restore'|'dismiss'):Promise<{success:boolean;text?:string;inputId?:string;error?:string}>;
        retry(sessionId:string,inputId:string):Promise<{success:boolean;error?:string}>;
        onChanged(callback:(state:InputFlowState)=>void):()=>void;
      };
      startup: {
        launchContext():Promise<{managed:boolean;openingWindow:boolean;pending:boolean}>;
        get():Promise<StartupResult>;
        save(config:StartupConfig):Promise<StartupResult>;
        importAudio():Promise<StartupResult>;
        removeAudio():Promise<StartupResult>;
      };
      chatFiles: {
        readImage(path:string, context?:{sessionId?:string}):Promise<{kind:string;path?:string;dataUrl?:string;fromCache?:boolean;error?:string}>;
        prepare(path:string, context?:{sessionId?:string}):Promise<{success:boolean;canceled?:boolean;handled?:boolean;path?:string;kind?:'file'|'directory';readOnly?:boolean;error?:string}>;
      };
      appearance: {
        get():Promise<AppearanceResult>;
        importMedia():Promise<AppearanceResult>;
        discardMedia(id:string):Promise<AppearanceResult>;
        save(config:AppearanceConfig):Promise<AppearanceResult>;
        onChanged(callback:(value:{config:AppearanceConfig;media:AppearanceMedia|null})=>void):()=>void;
      };
      getRuntimeInfo(): Promise<DevelopmentRuntimeInfo>;
      getRequestSummary(sessionId:string):Promise<null|{stage:'adapter'|'outbound';adapter?:string;protocol?:string;model:string;configuredEffort?:string|null;permissionMode?:string|null;parameters:Record<string,string|number>|null;toolCount:number|null;recordedAt:string;httpStatus?:number;failure?:string}>;
      /** Legacy access metadata only; the removed services do not listen on these reserved ports. */
      getServiceAccess(): Promise<{localAuth:{port:number;capability:string};meeting:{port:number;capability:string}}>;
    };
  }
}
