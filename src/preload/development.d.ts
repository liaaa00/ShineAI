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
export interface AppearanceResult {success:boolean;error?:string;canceled?:boolean;config?:AppearanceConfig;media?:AppearanceMedia|null}
/** window.shineAI.registry.fetchLeaderboard accepts these optional refresh preferences. */
export interface SkillLeaderboardOptions {force?:boolean}
export interface SkillLeaderboardResult {
  success:boolean;data:Array<{source:string;skillId:string;name:string;installs?:number}>;
  fetchedAt:number|null;stale:boolean;error?:string;errorCode?:string;
}
declare global {
  interface Window {
    development: {
      chatFiles: {
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
      /** Legacy access metadata only; the removed services do not listen on these reserved ports. */
      getServiceAccess(): Promise<{localAuth:{port:number;capability:string};meeting:{port:number;capability:string}}>;
    };
  }
}
