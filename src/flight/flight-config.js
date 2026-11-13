// Distances are metres, speeds m/s, rates per second, angles radians.
export const FLIGHT = Object.freeze({
 // Integration and input.
 hz:120, maxDelta:.1, cruiseSpeed:150/3.6, boostSpeed:450/3.6,
 verticalSpeed:25/3.6, boostRise:.6, boostFall:.8,
 acceleration:35, deceleration:20, brakeDeceleration:70,
 cruiseTurn:140*Math.PI/180, boostTurn:60*Math.PI/180,
 // Transition timing and vertical launch.
 glideTime:1, hoverSpeed:.4, launchSpeed:12, crouchTime:.075,
 launchTime:.28, landingDuration:.2, wallDuration:.2, wallDrag:1.5,
 // Boost resource and map limits.
 boostMinimum:15, boostDrain:24, energyRecovery:14, energyMax:100,
 ceiling:600, ceilingBand:65, edgeBand:70, edgeInset:3, limitAcceleration:160,
 // Swept body, surface impact and dive.
 sweepDistance:.16, skin:.002, bodyHeight:1.86, clearance:2.52,
 impactThreshold:18, impactEnergy:6, impactFade:4, impactFull:70,
 diveSpeed:200/3.6, slamSpeed:110, slamAcceleration:160, downPitch:.35,
 // Presentation. Pose bone targets are authored in flight-pose.js.
 maxPitch:1.48, maxBank:35*Math.PI/180, bankGain:.3, poseBlend:15, poseSurge:150,
 cameraFov:60, boostFov:85, cameraRoll:8*Math.PI/180, cameraEase:9,
 cameraDistance:7, cameraExtension:2.5, cameraHeight:3.4, cameraLook:1.65,
 cameraLead:1.7, cameraHeightLag:3, cameraLag:1, vaporLength:4, vaporOpacity:.35, debugHistory:10,
});
