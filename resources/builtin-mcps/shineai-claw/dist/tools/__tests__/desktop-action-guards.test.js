import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activationEvidenceMatches, activationOutsideNameHit, classifyForegroundResult, interpretActivatableHidVerify, interpretActivatableSelectVerify, isActivatableSelectionItem, isActivationOutsideNameControl, isNearMonochromeCapture, isSuspiciousBlankCapture, localActivationStateChanged, resolveCaptureBlankDecision, resolveFocusShowAction, resolveFollowTargetCaptureBounds, resolveFollowWindowCaptureBounds, resolveHidClickTypeForActivatable, resolveScreenshotCaptureMode, shouldFallbackClickAfterUia, shouldPrintWindowFallback, shouldRepaintAfterFocusShow, } from '../desktop-action-guards.js';
describe('isActivatableSelectionItem', () => {
    it('matches ListItem / TreeItem / TabItem / MenuItem', () => {
        assert.equal(isActivatableSelectionItem({ controlType: 'ControlType.ListItem' }), true);
        assert.equal(isActivatableSelectionItem({ controlType: 'TreeItem' }), true);
        assert.equal(isActivatableSelectionItem({ controlType: 'TabItem' }), true);
        assert.equal(isActivatableSelectionItem({ controlType: 'MenuItem' }), true);
        assert.equal(isActivatableSelectionItem({ controlType: 'Button', automationId: 'ok_btn' }), false);
        assert.equal(isActivatableSelectionItem({ controlType: 'Hyperlink' }), false);
    });
});
describe('localActivationStateChanged', () => {
    it('Selected-only / Focus-only flips are NOT activation', () => {
        assert.equal(localActivationStateChanged({ selected: 'False', focus: 'False' }, { selected: 'True', focus: 'True' }), false);
    });
    it('Toggle / Expand / Value / gone-from-tree ARE activation', () => {
        assert.equal(localActivationStateChanged({ expand: 'Collapsed' }, { expand: 'Expanded' }), true);
        assert.equal(localActivationStateChanged({ toggle: 'Off' }, { toggle: 'On' }), true);
        assert.equal(localActivationStateChanged({ value: 'a' }, { value: 'b' }), true);
        assert.equal(localActivationStateChanged({ selected: 'False' }, { alive: false }), true);
    });
});
describe('interpretActivatableSelectVerify / shouldFallbackClickAfterUia', () => {
    it('Select only IsSelected / no title·local evidence → not ok + needs fallback', () => {
        // Selected-only: localActivation false + title unchanged → no activation evidence.
        const selectedOnlyLocal = localActivationStateChanged({ selected: 'False', focus: 'False' }, { selected: 'True', focus: 'True' });
        const evidence = activationEvidenceMatches({
            targetName: 'Session row',
            beforeTitle: 'Inbox',
            afterTitle: 'Inbox',
            foregroundTitle: 'Inbox',
            localStateChanged: selectedOnlyLocal,
        });
        assert.equal(evidence, false);
        const interpreted = interpretActivatableSelectVerify({
            activatedAfter: evidence,
        });
        assert.equal(interpreted.ok, false);
        assert.equal(interpreted.verify, 'state_not_changed');
        assert.equal(interpreted.reason, 'needs_fallback_click');
        assert.equal(shouldFallbackClickAfterUia({ ok: false, verify: 'state_not_changed', reason: 'needs_fallback_click' }, true), true);
    });
    it('title / local evidence present → verified / no fallback', () => {
        const evidence = activationEvidenceMatches({
            targetName: 'Project Alpha',
            beforeTitle: 'Mail',
            afterTitle: 'Project Alpha — Mail',
            localStateChanged: false,
        });
        assert.equal(evidence, true);
        const interpreted = interpretActivatableSelectVerify({
            activatedAfter: evidence,
        });
        assert.equal(interpreted.ok, true);
        assert.equal(interpreted.verify, 'verified');
        assert.equal(shouldFallbackClickAfterUia({ ok: true, verify: 'verified' }, true), false);
    });
    it('activatable ok without verify=verified still needs fallback (no false success)', () => {
        assert.equal(shouldFallbackClickAfterUia({ ok: true, verify: 'uncertain' }, true), true);
        assert.equal(shouldFallbackClickAfterUia({ ok: true, verify: '' }, true), true);
        // Non-selection Button/Hyperlink: keep existing ok-based behavior.
        assert.equal(shouldFallbackClickAfterUia({ ok: true, verify: 'uncertain' }, false), false);
    });
});
describe('interpretActivatableHidVerify / resolveHidClickTypeForActivatable', () => {
    it('HID after still no evidence → hard fail (activation_unconfirmed)', () => {
        const hid = interpretActivatableHidVerify({ activatedAfter: false });
        assert.equal(hid.ok, false);
        assert.equal(hid.verify, 'state_not_changed');
        assert.equal(hid.reason, 'activation_unconfirmed');
    });
    it('HID after evidence → verified', () => {
        const hid = interpretActivatableHidVerify({ activatedAfter: true });
        assert.equal(hid.ok, true);
        assert.equal(hid.verify, 'verified');
        assert.equal(hid.reason, '');
    });
    it('activatable left-single escalates to one double-click short path', () => {
        assert.equal(resolveHidClickTypeForActivatable({
            isActivatable: true,
            button: 'left',
            clickType: 'single',
        }), 'double');
        assert.equal(resolveHidClickTypeForActivatable({
            isActivatable: true,
            button: 'left',
            clickType: 'double',
        }), 'double');
        assert.equal(resolveHidClickTypeForActivatable({
            isActivatable: false,
            button: 'left',
            clickType: 'single',
        }), 'single');
        assert.equal(resolveHidClickTypeForActivatable({
            isActivatable: true,
            button: 'right',
            clickType: 'single',
        }), 'single');
    });
});
describe('activationEvidenceMatches', () => {
    it('matches title contain / title change / local state', () => {
        assert.equal(activationEvidenceMatches({
            targetName: 'Project Alpha',
            beforeTitle: 'Mail',
            afterTitle: 'Project Alpha — Mail',
        }), true);
        assert.equal(activationEvidenceMatches({
            targetName: 'Project Alpha',
            beforeTitle: 'Inbox',
            afterTitle: 'Inbox',
            foregroundTitle: 'Project Alpha',
        }), true);
        assert.equal(activationEvidenceMatches({
            targetName: 'Project Alpha',
            beforeTitle: 'Inbox',
            afterTitle: 'Drafts',
        }), true);
        assert.equal(activationEvidenceMatches({
            targetName: 'Project Alpha',
            beforeTitle: 'Inbox',
            afterTitle: 'Inbox',
            localStateChanged: true,
        }), true);
        assert.equal(activationEvidenceMatches({
            targetName: 'Project Alpha',
            beforeTitle: 'Inbox',
            afterTitle: 'Inbox',
            foregroundTitle: 'Inbox',
        }), false);
    });
    it('title unchanged + elementGone only → NOT activated (search/popup close)', () => {
        assert.equal(activationEvidenceMatches({
            targetName: 'Session Row',
            beforeTitle: 'App',
            afterTitle: 'App',
            foregroundTitle: 'App',
            elementGone: true,
        }), false);
    });
    it('title unchanged + targetNameOutsideSelection → activated', () => {
        assert.equal(activationEvidenceMatches({
            targetName: 'Session Row',
            beforeTitle: 'App',
            afterTitle: 'App',
            foregroundTitle: 'App',
            targetNameOutsideSelection: true,
        }), true);
    });
    it('elementGone + outsideName still activated via outsideName', () => {
        assert.equal(activationEvidenceMatches({
            targetName: 'Session Row',
            beforeTitle: 'App',
            afterTitle: 'App',
            foregroundTitle: 'App',
            elementGone: true,
            targetNameOutsideSelection: true,
        }), true);
    });
    it('title unchanged + only ListItem still present / no outside hit → not activated', () => {
        assert.equal(activationEvidenceMatches({
            targetName: 'Session Row',
            beforeTitle: 'App',
            afterTitle: 'App',
            foregroundTitle: 'App',
            elementGone: false,
            targetNameOutsideSelection: false,
        }), false);
    });
});
describe('isActivationOutsideNameControl / activationOutsideNameHit', () => {
    it('excludes selection rows and query containers (Edit residual)', () => {
        assert.equal(isActivationOutsideNameControl('ListItem'), false);
        assert.equal(isActivationOutsideNameControl('ControlType.TreeItem'), false);
        assert.equal(isActivationOutsideNameControl('Edit'), false);
        assert.equal(isActivationOutsideNameControl('Document'), false);
        assert.equal(isActivationOutsideNameControl('ComboBox'), false);
    });
    it('accepts real display surfaces Text/Pane/Window', () => {
        assert.equal(isActivationOutsideNameControl('Text'), true);
        assert.equal(isActivationOutsideNameControl('Pane'), true);
        assert.equal(isActivationOutsideNameControl('Window'), true);
        assert.equal(isActivationOutsideNameControl('ControlType.Text'), true);
    });
    it('Edit residual query text is not an outsideName hit', () => {
        assert.equal(activationOutsideNameHit({
            controlType: 'Edit',
            name: 'Session Row',
            targetName: 'Session Row',
        }), false);
        assert.equal(activationOutsideNameHit({
            controlType: 'Document',
            name: 'query Session Row',
            targetName: 'Session Row',
        }), false);
    });
    it('exact Text/Pane/Window name is an outsideName hit; Contains search chrome is not', () => {
        assert.equal(activationOutsideNameHit({
            controlType: 'Text',
            name: 'Session Row',
            targetName: 'Session Row',
        }), true);
        assert.equal(activationOutsideNameHit({
            controlType: 'Text',
            name: 'Session Row - Search',
            targetName: 'Session Row',
        }), false);
        assert.equal(activationOutsideNameHit({
            controlType: 'Pane',
            name: 'chat Session Row',
            targetName: 'Session Row',
        }), false);
        assert.equal(activationOutsideNameHit({
            controlType: 'Pane',
            name: 'Session Row',
            targetName: 'Session Row',
        }), true);
        assert.equal(activationOutsideNameHit({
            controlType: 'Window',
            name: 'Session Row',
            targetName: 'Session Row',
        }), true);
        assert.equal(activationOutsideNameHit({
            controlType: 'ListItem',
            name: 'Session Row',
            targetName: 'Session Row',
        }), false);
    });
});
describe('classifyForegroundResult', () => {
    it('ok only when target is foreground, visible, not minimized', () => {
        assert.deepEqual(classifyForegroundResult({
            targetHwnd: 10,
            foregroundHwnd: 10,
            visible: true,
            iconic: false,
        }), { ok: true, reason: '' });
    });
    it('returns target_occluded when ShineAI covers target', () => {
        assert.deepEqual(classifyForegroundResult({
            targetHwnd: 10,
            foregroundHwnd: 99,
            visible: true,
            iconic: false,
            foregroundTitle: 'ShineAI — workspace',
        }), { ok: false, reason: 'target_occluded' });
    });
    it('returns focus_failed when not foreground', () => {
        assert.equal(classifyForegroundResult({
            targetHwnd: 10,
            foregroundHwnd: 11,
            visible: true,
            iconic: false,
            foregroundTitle: 'Notepad',
        }).reason, 'focus_failed:not_foreground');
    });
});
describe('resolveFocusShowAction', () => {
    it('restores iconic or tray/hidden; leaves visible non-iconic alone', () => {
        assert.equal(resolveFocusShowAction({ iconic: true }), 'restore');
        assert.equal(resolveFocusShowAction({ iconic: false, visible: false }), 'restore');
        assert.equal(resolveFocusShowAction({ iconic: false, visible: true }), 'none');
        assert.equal(resolveFocusShowAction({ iconic: false }), 'none');
    });
});
describe('resolveScreenshotCaptureMode / resolveFollowWindowCaptureBounds', () => {
    it('explicit / allScreens / monitor beat follow*', () => {
        assert.equal(resolveScreenshotCaptureMode({
            hasExplicitRegion: true,
            followForeground: true,
        }), 'explicit');
        assert.equal(resolveScreenshotCaptureMode({
            allScreens: true,
            followHandle: 42,
        }), 'allScreens');
        assert.equal(resolveScreenshotCaptureMode({
            monitorExplicit: true,
            followWindowTitle: 'App',
        }), 'monitor');
    });
    it('follow* selects followWindow; otherwise primary', () => {
        assert.equal(resolveScreenshotCaptureMode({ followForeground: true }), 'followWindow');
        assert.equal(resolveScreenshotCaptureMode({ followHandle: 123 }), 'followWindow');
        assert.equal(resolveScreenshotCaptureMode({ followWindowTitle: 'Notes' }), 'followWindow');
        assert.equal(resolveScreenshotCaptureMode({ followProcessId: 456 }), 'followWindow');
        assert.equal(resolveScreenshotCaptureMode({}), 'primary');
        assert.equal(resolveScreenshotCaptureMode({ followHandle: 0, followProcessId: 0 }), 'primary');
    });
    it('prefers windowRect, then windowScreen, then primary', () => {
        const primary = { x: 0, y: 0, width: 1920, height: 1080 };
        const screen = { x: 1920, y: 0, width: 2560, height: 1440 };
        const rect = { x: 100, y: 80, width: 800, height: 600 };
        assert.deepEqual(resolveFollowWindowCaptureBounds({
            windowRect: rect,
            windowScreen: screen,
            primaryScreen: primary,
        }), rect);
        assert.deepEqual(resolveFollowTargetCaptureBounds({
            windowRect: rect,
            windowScreen: screen,
            primaryScreen: primary,
        }), rect);
        assert.deepEqual(resolveFollowWindowCaptureBounds({
            windowScreen: screen,
            primaryScreen: primary,
        }), screen);
        assert.deepEqual(resolveFollowWindowCaptureBounds({ windowScreen: null, primaryScreen: primary }), primary);
        assert.deepEqual(resolveFollowWindowCaptureBounds({
            windowRect: { x: 0, y: 0, width: 0, height: 0 },
            windowScreen: { x: 0, y: 0, width: 0, height: 0 },
            primaryScreen: primary,
        }), primary);
        assert.deepEqual(resolveFollowWindowCaptureBounds({
            windowRect: { x: 0, y: 0, width: 0, height: 0 },
            windowScreen: screen,
            primaryScreen: primary,
        }), screen);
    });
});
describe('shouldRepaintAfterFocusShow', () => {
    it('repaints after restore (iconic or hidden)', () => {
        assert.equal(shouldRepaintAfterFocusShow(resolveFocusShowAction({ iconic: true })), true);
        assert.equal(shouldRepaintAfterFocusShow(resolveFocusShowAction({ iconic: false, visible: false })), true);
        assert.equal(shouldRepaintAfterFocusShow(resolveFocusShowAction({ iconic: false, visible: true })), false);
        assert.equal(shouldRepaintAfterFocusShow('restore'), true);
        assert.equal(shouldRepaintAfterFocusShow('none'), false);
    });
});
describe('isNearMonochromeCapture / PrintWindow blank path', () => {
    it('flags solid / near-solid gray (smoke #E0E0E0 uniq=1)', () => {
        assert.equal(isNearMonochromeCapture({ uniqueColors: 1 }), true);
        assert.equal(isNearMonochromeCapture({ uniqueColors: 4 }), true);
        assert.equal(isNearMonochromeCapture({ uniqueColors: 5 }), false);
        assert.equal(isNearMonochromeCapture({ uniqueColors: 20, luminanceVariance: 2 }), true);
        assert.equal(isNearMonochromeCapture({ uniqueColors: 20, luminanceVariance: 30 }), false);
    });
    it('isSuspiciousBlankCapture: post-restore near-gray (uniq≈149) but not normal UI', () => {
        assert.equal(isSuspiciousBlankCapture({ uniqueColors: 149, luminanceVariance: 40 }), true);
        assert.equal(isSuspiciousBlankCapture({ uniqueColors: 64, luminanceVariance: 200 }), true);
        assert.equal(isSuspiciousBlankCapture({ uniqueColors: 1 }), true); // near-mono
        assert.equal(isSuspiciousBlankCapture({ uniqueColors: 1800, luminanceVariance: 40 }), false);
        assert.equal(isSuspiciousBlankCapture({ uniqueColors: 149, luminanceVariance: 500 }), false);
        assert.equal(isSuspiciousBlankCapture({ uniqueColors: 149 }), false); // need variance
    });
    it('PrintWindow only when blank + resolvable HWND', () => {
        assert.equal(shouldPrintWindowFallback({ isNearBlank: true, targetHwnd: 42 }), true);
        assert.equal(shouldPrintWindowFallback({ isNearBlank: true, targetHwnd: 0 }), false);
        assert.equal(shouldPrintWindowFallback({ isNearBlank: true, targetHwnd: null }), false);
        assert.equal(shouldPrintWindowFallback({ isNearBlank: false, targetHwnd: 42 }), false);
        // follow near-gray → treat as blank for PW gate
        assert.equal(shouldPrintWindowFallback({
            isNearBlank: isSuspiciousBlankCapture({ uniqueColors: 149, luminanceVariance: 40 }),
            targetHwnd: 42,
        }), true);
    });
    it('resolveCaptureBlankDecision: try PrintWindow then capture_blank', () => {
        assert.equal(resolveCaptureBlankDecision({ isNearBlank: false }), 'ok');
        assert.equal(resolveCaptureBlankDecision({ isNearBlank: true, targetHwnd: 99 }), 'try_printwindow');
        assert.equal(resolveCaptureBlankDecision({ isNearBlank: true, targetHwnd: null }), 'capture_blank');
        assert.equal(resolveCaptureBlankDecision({
            isNearBlank: true,
            targetHwnd: 99,
            printWindowTried: true,
            stillBlankAfterPrintWindow: false,
        }), 'ok');
        assert.equal(resolveCaptureBlankDecision({
            isNearBlank: true,
            targetHwnd: 99,
            printWindowTried: true,
            stillBlankAfterPrintWindow: true,
        }), 'capture_blank');
    });
});
