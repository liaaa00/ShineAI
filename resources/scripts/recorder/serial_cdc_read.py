# -*- coding: utf-8 -*-
"""Read USB CDC bytes. Must raise DTR so firmware sends SHINEAI_REC_V1 and 921600."""
import ctypes
import sys
from ctypes import wintypes

GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
INVALID_HANDLE = wintypes.HANDLE(-1).value
SETDTR = 5
CLRDTR = 6
SETRTS = 3
PURGE_RXCLEAR = 0x0008
PURGE_TXCLEAR = 0x0004


class COMMTIMEOUTS(ctypes.Structure):
    _fields_ = [
        ('ReadIntervalTimeout', wintypes.DWORD),
        ('ReadTotalTimeoutMultiplier', wintypes.DWORD),
        ('ReadTotalTimeoutConstant', wintypes.DWORD),
        ('WriteTotalTimeoutMultiplier', wintypes.DWORD),
        ('WriteTotalTimeoutConstant', wintypes.DWORD),
    ]


class DCB(ctypes.Structure):
    _fields_ = [
        ('DCBlength', wintypes.DWORD),
        ('BaudRate', wintypes.DWORD),
        ('flags', wintypes.DWORD),
        ('wReserved', wintypes.WORD),
        ('XonLim', wintypes.WORD),
        ('XoffLim', wintypes.WORD),
        ('ByteSize', ctypes.c_ubyte),
        ('Parity', ctypes.c_ubyte),
        ('StopBits', ctypes.c_ubyte),
        ('XonChar', ctypes.c_char),
        ('XoffChar', ctypes.c_char),
        ('ErrorChar', ctypes.c_char),
        ('EofChar', ctypes.c_char),
        ('EvtChar', ctypes.c_char),
        ('wReserved1', wintypes.WORD),
    ]


def main() -> int:
    if len(sys.argv) < 2:
        print('usage: serial_cdc_read.py COM5 [baud]', file=sys.stderr)
        return 2
    com = sys.argv[1].strip().upper()
    baud = int(sys.argv[2]) if len(sys.argv) > 2 else 921600
    if not com.startswith('COM'):
        print('port must look like COM5', file=sys.stderr)
        return 2

    k32 = ctypes.WinDLL('kernel32', use_last_error=True)
    path = r'\\.\%s' % com
    handle = k32.CreateFileW(path, GENERIC_READ | GENERIC_WRITE, 0, None, OPEN_EXISTING, 0, None)
    if handle == INVALID_HANDLE:
        print(f'open {path} failed: {ctypes.get_last_error()}', file=sys.stderr)
        return 1

    dcb = DCB()
    dcb.DCBlength = ctypes.sizeof(DCB)
    if k32.GetCommState(handle, ctypes.byref(dcb)):
        dcb.BaudRate = baud
        dcb.ByteSize = 8
        dcb.Parity = 0
        dcb.StopBits = 0
        k32.SetCommState(handle, ctypes.byref(dcb))

    timeouts = COMMTIMEOUTS(1, 0, 50, 0, 0)
    k32.SetCommTimeouts(handle, ctypes.byref(timeouts))
    k32.PurgeComm(handle, PURGE_RXCLEAR | PURGE_TXCLEAR)
    k32.EscapeCommFunction(handle, CLRDTR)
    k32.Sleep = getattr(k32, 'Sleep', None)
    ctypes.windll.kernel32.Sleep(40)
    k32.EscapeCommFunction(handle, SETDTR)
    k32.EscapeCommFunction(handle, SETRTS)

    buf = ctypes.create_string_buffer(4096)
    read = wintypes.DWORD()
    try:
        while True:
            ok = k32.ReadFile(handle, buf, 4096, ctypes.byref(read), None)
            if not ok:
                err = ctypes.get_last_error()
                if err:
                    print(f'read failed: {err}', file=sys.stderr)
                    return 1
                continue
            if read.value:
                sys.stdout.buffer.write(buf.raw[:read.value])
                sys.stdout.buffer.flush()
    finally:
        k32.CloseHandle(handle)


if __name__ == '__main__':
    raise SystemExit(main())
