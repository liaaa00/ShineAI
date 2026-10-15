import fs from 'node:fs';
import path from 'node:path';

export function prepareExtractor(root, toolRoot, sevenZipExe) {
  const source = path.join(toolRoot, 'node_modules/app-builder-lib/templates/nsis');
  const destination = path.join(root, 'artifacts/installer-nsis');
  if (path.dirname(destination) !== path.join(root, 'artifacts') || (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink())) throw new Error('Invalid NSIS staging directory');
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  const quote = file => '"' + file.replaceAll('$', '$$') + '"';
  let extractor = fs.readFileSync(path.join(source, 'include/extractAppPackage.nsh'), 'utf8');
  const start = extractor.indexOf('!macro decompress');
  const end = extractor.indexOf('!macroend', start) + '!macroend'.length;
  if (start < 0 || end < start) throw new Error('NSIS decompression macro missing');
  // Run the modern standalone extractor directly into the installation folder.
  // Avoid the legacy unzip DLL and the 7z plugin's temporary-directory copy.
  extractor = extractor.slice(0, start) + `!macro decompress
  File /oname=$PLUGINSDIR\\7za.exe ${quote(sevenZipExe)}
  DetailPrint "Extracting the independent runtime and application…"
  nsExec::ExecToLog '"$PLUGINSDIR\\7za.exe" x "$PLUGINSDIR\\app-$packageArch.\${COMPRESSION_METHOD}" -o"$INSTDIR" -y -bd -bb0'
  Pop $R0
  StrCmp $R0 "0" extractor_success
    MessageBox MB_OK|MB_ICONSTOP "Extraction failed (code $R0)." /SD IDOK
    SetErrorLevel 1
    Quit
  extractor_success:
!macroend` + extractor.slice(end);
  fs.writeFileSync(path.join(destination, 'include/extractAppPackage.nsh'), extractor);
  return destination;
}
