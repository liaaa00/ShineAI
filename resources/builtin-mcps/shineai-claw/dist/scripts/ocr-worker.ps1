param(
    [string]$ImgPath,
    [int]$CaptureX,
    [int]$CaptureY,
    [int]$CaptureW,
    [int]$CaptureH,
    [string]$OutFile
)

# Debug: log params to a diagnostic file next to output
$debugFile = $OutFile + '.debug.txt'
"ImgPath=$ImgPath`nCaptureX=$CaptureX`nCaptureY=$CaptureY`nCaptureW=$CaptureW`nCaptureH=$CaptureH`nOutFile=$OutFile`nSTA=$([System.Threading.Thread]::CurrentThread.GetApartmentState())" | Set-Content $debugFile -Encoding UTF8

# Windows.Media.Ocr worker — must run in STA thread (powershell.exe -STA)
Add-Type -AssemblyName 'System.Runtime.WindowsRuntime'
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapAlphaMode, Windows.Foundation.UniversalApiContract, ContentType=WindowsRuntime]

$asTaskMethod = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await-WinRT($op, [Type]$resultType) {
    $typed = $asTaskMethod.MakeGenericMethod($resultType)
    $task = $typed.Invoke($null, @($op))
    $task.Wait(15000) | Out-Null
    return $task.Result
}

$storageFile = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($ImgPath)) ([Windows.Storage.StorageFile])
$stream = Await-WinRT ($storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$rawBmp = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$softBmp = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert($rawBmp, [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied)

$ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $ocrEngine) { $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage('en-US') }
$ocrResult = Await-WinRT ($ocrEngine.RecognizeAsync($softBmp)) ([Windows.Media.Ocr.OcrResult])

$imgW = $decoder.PixelWidth; $imgH = $decoder.PixelHeight
$scaleX = $imgW / $CaptureW; $scaleY = $imgH / $CaptureH

$lines = @()
foreach ($line in $ocrResult.Lines) {
    foreach ($word in $line.Words) {
        $r = $word.BoundingRect
        $scrX = [int]($CaptureX + $r.X / $scaleX + $r.Width / $scaleX / 2)
        $scrY = [int]($CaptureY + $r.Y / $scaleY + $r.Height / $scaleY / 2)
        $text = $word.Text
        if ($text.Length -lt 1) { continue }
        $w = [int]($r.Width / $scaleX); $h = [int]($r.Height / $scaleY)
        $lines += "$text|$scrX|$scrY|$w|$h"
    }
}
$lines -join "`n" | Set-Content -Path $OutFile -Encoding UTF8
$stream.Dispose()
