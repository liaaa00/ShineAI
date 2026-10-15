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
export interface AppearanceConfig {
  version:1; enabled:boolean; media:string|null; fit:'cover'|'contain'; positionX:number; positionY:number; motion:boolean;
  light: {strength:number;mask:number;transparency:number;blur:number;panelBlur:number};
  dark: {strength:number;mask:number;transparency:number;blur:number;panelBlur:number};
}
export interface AppearanceMedia {id:string;name:string;type:string;url:string;size:number}
export interface AppearanceResult {success:boolean;error?:string;canceled?:boolean;config?:AppearanceConfig;media?:AppearanceMedia|null}
export interface RemoteSession {id:string;name:string;status:string;workspace:string|null}
export interface RemoteState {success:boolean;error?:string;warning?:string;serverUrl?:string;deviceId?:string;name?:string;enabled?:boolean;sessionIds?:string[];connection?:string;sessions?:RemoteSession[]}
declare global {
  interface Window {
    development: {
      remote: {
        get():Promise<RemoteState>;
        pair(input:{serverUrl:string;code:string;name:string}):Promise<RemoteState>;
        setAccess(input:{enabled:boolean;sessionIds:string[]}):Promise<RemoteState>;
        disconnect():Promise<RemoteState>;
        forget():Promise<RemoteState>;
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
