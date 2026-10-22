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
export interface RunningInput {id:string;revision:number;text:string;state:'queued'|'submitted'|'sent'|'failed'|'interrupted'|'cancelled';transport:'unknown'|'native-api'|'sdk';createdAt:string;sentAt?:string;error?:string}
export interface InputFlowState {sessionId:string;revision:number;requiredRevision:number;reviewedRevision:number;requestRevision:number;version:number;inputs:RunningInput[]}
export interface StartupResult {success:boolean;error?:string;canceled?:boolean;config?:StartupConfig;audio?:AppearanceMedia|null;previewUrl?:string;facts?:{version:string;profile:string;sandbox:string;platform:string}}
/** window.shineAI.registry.fetchLeaderboard accepts these optional refresh preferences. */
export interface SkillLeaderboardOptions {force?:boolean}
export interface SkillLeaderboardResult {
  success:boolean;data:Array<{source:string;skillId:string;name:string;installs?:number}>;
  fetchedAt:number|null;stale:boolean;error?:string;errorCode?:string;
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
