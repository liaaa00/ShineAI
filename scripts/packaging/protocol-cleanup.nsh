; Electron registers URL handlers itself; only remove handlers owned by this
; installation, leaving other engineering/installed development copies alone.
!macro removeOwnedDevelopmentProtocol SCHEME
  ReadRegStr $R0 HKCU "Software\Classes\${SCHEME}\shell\open\command" ""
  StrCmp $R0 '$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" $\"%1$\"' 0 +2
    DeleteRegKey HKCU "Software\Classes\${SCHEME}"
!macroend

!macro customUnInstall
  SetRegView 64
  !insertmacro removeOwnedDevelopmentProtocol "shineai-dev"
  !insertmacro removeOwnedDevelopmentProtocol "claudeops-dev"
  SetRegView 32
  !insertmacro removeOwnedDevelopmentProtocol "shineai-dev"
  !insertmacro removeOwnedDevelopmentProtocol "claudeops-dev"
  SetRegView 64
!macroend
