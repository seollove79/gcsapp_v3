<script>
    import {
        onMount,
        onDestroy,
        beforeUpdate,
        afterUpdate,
        tick,
    } from "svelte";
    import {
        DRONEKIT_API,
        MAP_VIEWER,
        DRONE_YAW_OFFSET,
        DRONE_MODEL_SCALE,
        API_CALL_INTERVAL,
        DRONE_ALTITUDE_OFFSET,
        SHOW_TAKEOFF_INFO,
        SELECTED_DRONE,
    } from "../store";
    export let droneID;
    let showStatus = false;
    export let planningMode = false;
    export function getPlanningMode() {
        return planningMode;
    }

    import * as Cesium from "cesium";
    import Message from "./message.svelte";

    let drone = null;
    let intervalInstance = null;
    export let missionAlt = 30;
    export let missionAltType = "relative";
    export let missionRadius = 2.00;   
    export function setShowStatus(value) {
        showStatus = value;
    }

    let doVerticalView = false;
    let workVerticalView = null;

    let doTailView = false;
    let workTailView = null;

    let doFPVView = false;
    let workFPVView = null;    

    onMount(() => {
        if (intervalInstance === null) {
            intervalInstance = setInterval(getDroneStatus, $API_CALL_INTERVAL);
        }
    });

    export let droneStatus = {
        airSpeed: 0,
        groundSpeed: 0,
        voltage: "--",
        level: "--",
        mode: "--",
        gps: null,
        gpsFix: null,
        armed: null,
        ekf: null,
        lat: 0,
        lng: 0,
        alt: 0,
        slAlt: 0,
        roll: 0,
        pitch: 0,
        yaw: 0,
        home: null,
        homeAlt: 0,
        calSLAlt: 0,
    };
    
    export function callDroneStatus() {
        return droneStatus;
    }

    let targetAltitude = 10;
    let entityManager = {
        waypointPost: [],
		waypointPoint: [],
        waypointLine: [],
    };

    let commands = [];
    

    function getDroneStatus() {
        let homeAlt=0;
        let homeLat=0;
        let homeLng=0;
        let calSLAlt = 0;
        fetch($DRONEKIT_API + "drone_status/" + encodeURIComponent(droneID), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                let voltage = data["Battery"].split(",")[0];
                voltage = voltage.split("=")[1];
                voltage = parseFloat(voltage).toFixed(2);

                let level = data["Battery"].split(",")[2];
                level = level.split("=")[1];

                let gps = data["GPS"].split(",")[1];
                gps = gps.split("=")[1];

                let gpsFix = data["GPS"].split(",")[0];
                gpsFix = gpsFix.split("=")[1];
                switch (gpsFix) {
                    case "0":
                        gpsFix = "No";
                        break;
                    case "1":
                        gpsFix = "No";
                        break;
                    case "2":
                        gpsFix = "2D";
                        break;
                    case "3":
                        gpsFix = "3D";
                        break;
                }

                let ekf_ok = data["ekf_ok"];
                if (ekf_ok === true) {
                    ekf_ok = "EKF OK";
                } else {
                    ekf_ok = "EKF Error";
                }

                let armed = data["Armed"];
                if (armed === true) {
                    armed = "ARMED";
                } else {
                    armed = "DISARMED";
                }

                if (data["Home"] === "None") {
                    homeLat = 0;
                    homeLng = 0;
                    homeAlt = 0;
                } else {
                    let splitHome = data["Home"].split(":");
                    splitHome = splitHome[1];
                    splitHome = splitHome.split(",");
                    let lat = splitHome[0];
                    let lon = splitHome[1];
                    let alt = splitHome[2];
                    homeLat = lat.split("=")[1];
                    homeLng = lon.split("=")[1];
                    homeAlt = alt.split("=")[1];
                }

                

                let cartographicPosition = Cesium.Cartographic.fromDegrees(parseFloat(homeLng), parseFloat(homeLat));
                let globe = $MAP_VIEWER.scene.globe;
                let height = globe.getHeight(cartographicPosition);
                calSLAlt = height + parseFloat(data["Alt"]); //홈포지션의 해수면고도 + 상대고도
               
                droneStatus = {
                    airSpeed: parseFloat(data["AirSpeed"]).toFixed(1),
                    groundSpeed: parseFloat(data["GroundSpeed"]).toFixed(1),
                    voltage: voltage + "V",
                    level: level + "%",
                    mode: data["Mode"],
                    gps: gps,
                    gpsFix: gpsFix,
                    armed: armed,
                    ekf: ekf_ok,
                    lat: data["Lat"],
                    lng: data["Lng"],
                    alt: parseFloat(data["Alt"]).toFixed(1),
                    slAlt: parseFloat(data["SL_Alt"]).toFixed(1),
                    roll: data["Roll"],
                    pitch: data["Pitch"],
                    yaw: data["Yaw"],
                    home: data["Home"],
                    homeAlt : height,
                    calSLAlt: calSLAlt,
                };

                droneStatus = droneStatus;
                // if (!doFPVView) {
                    viewDrone();
                // }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    function armOrDisarmDrone() {
        let action = null;
        if (droneStatus.armed === "ARMED") {
            action = "disarm_drone";
        } else {
            action = "arm_drone";
        }
        fetch($DRONEKIT_API + action + "/" + encodeURIComponent(droneID), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    function land() {
        fetch($DRONEKIT_API + "land/" + encodeURIComponent(droneID), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    export async function changeFlightMode(newMode) {
        try {
            const response = await fetch($DRONEKIT_API + "change_mode/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    drone_id: droneID,
                    new_mode: newMode,
                }),
            });

            if (!response.ok) {
                throw new Error("서버 에러: " + response.statusText);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
        }
    }

    function viewDrone() {
        if (drone != null) {
            let position = Cesium.Cartesian3.fromDegrees(
                droneStatus.lng,
                droneStatus.lat,
                droneStatus.calSLAlt + $DRONE_ALTITUDE_OFFSET,
            );
            let hpr = new Cesium.HeadingPitchRoll(
                Cesium.Math.toRadians(droneStatus.yaw - $DRONE_YAW_OFFSET),
                droneStatus.pitch,
                droneStatus.roll,
            );
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(
                position,
                hpr,
            );
            drone.position = position;
            drone.orientation = orientation;
        } else {
            drone = $MAP_VIEWER.entities.add({
                name: "Drone",
                position: Cesium.Cartesian3.fromDegrees(
                    droneStatus.lng,
                    droneStatus.lat,
                    droneStatus.calSLAlt + $DRONE_ALTITUDE_OFFSET,
                ), // 드론의 초기 위치 (경도, 위도, 높이)
                model: {
                    uri: "/drone.glb",
                    scale: $DRONE_MODEL_SCALE,
                },
                label: {
                    text: droneID,
                    font: "14px sans-serif",
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -50),},
                // viewFrom: new Cesium.Cartesian3(-10, 0, -10)
            });
        }
    }

    export function changeDoVerticalView() {
        doVerticalView = !doVerticalView;
        setDoVerticalView(doVerticalView);
    }

    function setDoVerticalView(value) {
        doVerticalView = value;
        if (doVerticalView) {
            $MAP_VIEWER.trackedEntity = drone;
            $MAP_VIEWER.scene.preRender.addEventListener(updateCameraAboveDrone);
            setDoTailView(false);
            setDoFPVView(false);
        } else {
            $MAP_VIEWER.trackedEntity = null;
            $MAP_VIEWER.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            $MAP_VIEWER.scene.preRender.removeEventListener(updateCameraAboveDrone);
        }
    }

    export function changeDoTailView() {
        doTailView = !doTailView;
        setDoTailView(doTailView);
    }

    function setDoTailView(value) {
        doTailView = value;
        if (doTailView) {
            $MAP_VIEWER.trackedEntity = drone;
            $MAP_VIEWER.scene.preRender.addEventListener(updateCameraBehindDrone);
            setDoVerticalView(false);
            setDoFPVView(false);
        } else {
            $MAP_VIEWER.trackedEntity = null;
            $MAP_VIEWER.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            $MAP_VIEWER.scene.preRender.removeEventListener(updateCameraBehindDrone);
        }
    }

    export function changeDoFPVView() {
        doFPVView = !doFPVView;
        setDoFPVView(doFPVView);
    }

    function setDoFPVView(value) {
        doFPVView = value;
        if (doFPVView) {
            $MAP_VIEWER.trackedEntity = drone;
            $MAP_VIEWER.scene.preRender.addEventListener(updateCameraFPV);
            drone.show = false;
            setDoVerticalView(false);
            setDoTailView(false);
        } else {
            drone.show = true;
            $MAP_VIEWER.trackedEntity = null;
            $MAP_VIEWER.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            $MAP_VIEWER.scene.preRender.removeEventListener(updateCameraFPV);
        }
    }

    function updateCameraBehindDrone() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.calSLAlt,
        );

        // 드론의 현재 위치를 바라보는 카메라의 orientation 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            Cesium.Math.toRadians(-10), // 드론을 약간 위에서 내려다보는 시점
            3 // 10미터 뒤에서 드론을 바라봄
        );

        $MAP_VIEWER.camera.lookAt(
            dronePosition,
            hpr
        );
    }

    function updateCameraAboveDrone() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.calSLAlt,
        );

        // 드론의 현재 위치를 바라보는 카메라의 orientation 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            Cesium.Math.toRadians(-90), // 드론을 약간 위에서 내려다보는 시점
            30 // 10미터 뒤에서 드론을 바라봄
        );

        $MAP_VIEWER.camera.lookAt(
            dronePosition,
            hpr
        );
    }

    function updateCameraFPV() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.calSLAlt,
        );

        // 드론의 현재 위치를 바라보는 카메라의 orientation 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            Cesium.Math.toRadians(-10), // 드론을 약간 위에서 내려다보는 시점
            0.1
        );

        $MAP_VIEWER.camera.lookAt(
            dronePosition,
            hpr
        );
    }

    function takeoff() {
        $SHOW_TAKEOFF_INFO = true;
    }

    function changePlanningMode() {
        planningMode = !planningMode;
    }

    export function makeFlightPlan(latitude, longitude) {
        let targetAltitude = 0;
        if (missionAltType === "relative" || missionAltType === "absolute") {
            targetAltitude = missionAlt;
        } else if (missionAltType === "terrain") {
            //목표지점의 해발고도를 구하고, 거리를 더해준다.
            let cartographicPosition = Cesium.Cartographic.fromDegrees(parseFloat(longitude), parseFloat(latitude));
            let globe = $MAP_VIEWER.scene.globe;
            let height = globe.getHeight(cartographicPosition);
            targetAltitude = height + missionAlt;
        }

        commands.push({
            command: "waypoint",
            latitude: latitude,
            longitude: longitude,
            altitude: targetAltitude,
            altitudeType: missionAltType,
            radius: missionRadius,
            delay: 0,
        });
        commands = commands;

        drawWaypoint();
    };

    function drawWaypoint() {
        entityManager.waypointPoint.forEach((entity) => {
            $MAP_VIEWER.entities.remove(entity);
        });
        entityManager.waypointPost.forEach((entity) => {
            $MAP_VIEWER.entities.remove(entity);
        });
        entityManager.waypointLine.forEach((entity) => {
            $MAP_VIEWER.entities.remove(entity);
        });

        entityManager = {
            waypointPost: [],
            waypointPoint: [],
            waypointLine: [],
        }

        commands.forEach((command, index) => {
            let point1 = Cesium.Cartesian3.fromDegrees(
                command.longitude,
                command.latitude,
            );

            let targetAltitude = 0;
            
            if (command.altitudeType === "relative") {
                targetAltitude = droneStatus.homeAlt + command.altitude;
            } else if (command.altitudeType === "absolute") {
                targetAltitude = command.altitude;
            } else if (command.altitudeType === "terrain") {
                targetAltitude = command.altitude;
            }
            
            let point2 = Cesium.Cartesian3.fromDegrees(
                command.longitude,
                command.latitude,
                targetAltitude,
            );

            // waypoint 기둥 그리기
            let waypointPost = $MAP_VIEWER.entities.add({
                polyline: {
                    positions: [point1, point2],
                    width: 2,
                    color: Cesium.Color.RED,
                },
            });

            entityManager.waypointPost.push(waypointPost);

            let waypointPoint = $MAP_VIEWER.entities.add({
                position: point2,
                point: {
                    pixelSize: 15,
                    color: Cesium.Color.YELLOW,
                },
            });
            entityManager.waypointPoint.push(waypointPoint);

            //index가 1 이상이면 포인트 간에 점선으로 라인을 그린다.
            if (index > 0) {
                let line = $MAP_VIEWER.entities.add({
                    polyline: {
                        positions: [point2, entityManager.waypointPoint[index - 1].position.getValue()],
                        width: 2,
                        material: new Cesium.PolylineDashMaterialProperty({
                            color: Cesium.Color.YELLOW,
                        }),
                    },
                });
                entityManager.waypointLine.push(line);
            }

        });
    }

    function delCommand(index) {
        commands.splice(index, 1);
        commands = commands;
        drawWaypoint();
    }

    async function sendCommands() {
        
        console.log(commands);
        try {
            const response = await fetch($DRONEKIT_API + "upload_mission/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    drone_id: droneID,
                    waypoints: commands,
                }),
            });

            if (!response.ok) {
                throw new Error("서버 에러: " + response.statusText);
            }

            const data = await response.json();
            if(data.status === "success") {
                planningMode = false;
            } else {
                alert("비행계획 전송에 실패했습니다.");
            };
        } catch (error) {
            console.error("Error:", error);
        } finally {
        }
    }

    // 기체에서 미션 가져오기
    async function downloadMission() {
        try {
            const response = await fetch($DRONEKIT_API + "download_mission/" + encodeURIComponent(droneID), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("서버 에러: " + response.statusText);
            }

            const data = await response.json();

            console.log(data.mission);
            let newCommands = [];
            data.mission.forEach((command) => {
                let commandStr = "";
                let altitudeType = "";
                switch(command.command) {
                    case 16:
                        commandStr = "waypoint";
                        break;
                    case 21:
                        commandStr = "land";
                        break;
                }

                switch(command.frame) {
                    case 3:
                        altitudeType = "relative";
                        break;
                    case 0:
                        altitudeType = "absolute";
                        break;
                }
                newCommands.push({
                    command: commandStr,
                    latitude: command.x,
                    longitude: command.y,
                    altitude: command.z,
                    altitudeType: altitudeType,
                    radius: command.param2,
                    delay: command.param1,
                });
            });

            commands = newCommands;
            drawWaypoint();
        } catch (error) {
            console.error("Error:", error);
        } finally {
        }
    }

    function handleChangeCommand() {
        commands = commands;
        drawWaypoint();
    }

    // 지도상의 특정 오브젝트를 클릭했을 때 오브젝트의 좌표와 고도를 가져오는 함수
    $MAP_VIEWER.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
        let pickedObject = $MAP_VIEWER.scene.pick(movement.position);
        if (Cesium.defined(pickedObject)) {
            // object의 아이디  가져오기
            let cartesian = $MAP_VIEWER.scene.pickPosition(movement.position);
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let targetLng = Cesium.Math.toDegrees(cartographic.longitude);
            let targetLat = Cesium.Math.toDegrees(cartographic.latitude);
            console.log(targetLng, targetLat);

            let go = confirm("목표물을 타격 하시겠습니까?");
            if (go) {
                fetch($DRONEKIT_API + "goto_location/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        drone_id: $SELECTED_DRONE,
                        latitude: parseFloat(targetLat),
                        longitude: parseFloat(targetLng),
                        // altitude: parseFloat(guideAlt),
                        altitude: 0,
                        method: 'relative',
                    }),
                })

            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    


    
</script>

{#if showStatus === true}
    <div style="width:400px">
        <div class="container">
            <div class="row gray-translucent-bg">
                <div class="col">드론ID : {droneID}</div>
            </div>
            <div class="row black-translucent-bg">
                <div class="container" style="border:1px solid rgba(150,150,150,0.8); border-radius:5px;">
                    <div class="row gray-translucent-bg">
                        <div class="col">배터리</div>
                        <div class="col">GPS</div>
                        <div class="col">Telemetry</div>
                    </div>
                    <div class="row" style="padding:5px 0 5px 0">
                        <div class="col">
                            {droneStatus.voltage}({droneStatus.level})
                        </div>
                        <div class="col">
                            {droneStatus.gps}({droneStatus.gpsFix})
                        </div>
                        <div class="col">99%(25%)</div>
                    </div>
                </div>
                <div class="container">
                    <div class="row" style="padding:5px 0 4px 0;color:yellow">
                        <div class="col">{droneStatus.armed}</div>
                        <div class="col">{droneStatus.mode}</div>
                        <div class="col">{droneStatus.ekf}</div>
                    </div>
                </div>
                <div class="container" style="border:1px solid rgba(150,150,150,0.8); border-radius:5px;">
                    <div class="row">
                        <div class="col g-0" style="border-right:1px solid rgba(150,150,150,0.8);">
                            <div class="container">
                                <div class="row" style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;">
                                    <div class="col">고도 (m)</div>
                                </div>
                                <div class="row" style="padding:5px 0 5px 0">
                                    <div class="col">{droneStatus.alt}(상대)</div>
                                    <div class="col">{droneStatus.slAlt}(해발)</div>
                                </div>
                            </div>
                        </div>
                        <div class="col g-0" style="border-right:1px solid rgba(150,150,150,0.8);">
                            <div class="container">
                                <div class="row" style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;">
                                    <div class="col">속도 (m/s)</div>
                                </div>
                                <div class="row" style="padding:5px 0 5px 0">
                                    <div class="col">{droneStatus.airSpeed}(Air)</div>
                                    <div class="col">{droneStatus.groundSpeed}(Ground)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 시점 패널 시작 -->
    <div style="width:400px" class="status-layer">
        <div class="container">
            <div class="row gray-translucent-bg">
                <div class="col">시점제어 ({droneID})</div>
            </div>
            <div class="row black-translucent-bg">
                <div class="container p-0">
                    <div class="row g-1">
                        <div class="col">
{#if doVerticalView === true}
                            <button type="button" class="btn btn-secondary" style="width:100%;background-color:red;" on:click={changeDoVerticalView}>위에서 보기</button>
{:else}
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={changeDoVerticalView}>위에서 보기</button>
{/if}
                        </div>
                        <div class="col">
{#if doTailView === true}
                            <button type="button" class="btn btn-secondary" style="width:100%;background-color:red" on:click={changeDoTailView}>뒤에서 보기</button>
{:else}
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={changeDoTailView}>뒤에서 보기</button>
{/if}
                        </div>
                        <div class="col">
{#if doFPVView === true}
                            <button type="button" class="btn btn-secondary" style="width:100%;background-color:red" on:click={changeDoFPVView}>FPV 시점</button>
{:else}
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={changeDoFPVView}>FPV 시점</button>
{/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 명령 패널 시작 -->
    <div style="width:400px" class="status-layer">
        <div class="container">
            <div class="row gray-translucent-bg">
                <div class="col">제어명령 ({droneID})</div>
            </div>
            <div class="row black-translucent-bg">
                <div class="container p-0">
                    <div class="row g-1">
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={armOrDisarmDrone}>시동/종료</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={takeoff}>이륙</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={land}>착륙</button>
                        </div>
                    </div>
                    <div class="row g-1" style="margin-top:0px">
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={() => changeFlightMode("LOITER")}>LOITER</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={() => changeFlightMode("ALT_HOLD")}>ALT HOLD</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={() => changeFlightMode("STABILIZE")}>STABILIZE</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 비행계획 패널 시작 -->
    <div style="width:400px" class="status-layer">
        <div class="container">
            <div class="row gray-translucent-bg">
                <div class="col">비행계획 ({droneID})</div>
            </div>
            <div class="row black-translucent-bg">
                <div class="container p-0">
                    <div class="row g-1">
                        <div class="col">
{#if planningMode === true}
                            <button type="button" class="btn btn-secondary" style="width:100%;background-color:red;" on:click={changePlanningMode} id="btnChangePlanningMode">계획모드비활성화</button>
{:else}
                            <button type="button" class="btn btn-secondary" style="width:100%;" on:click={changePlanningMode} id="btnChangePlanningMode">계획모드활성화</button>
{/if}
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={sendCommands}>계획전송</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={() => changeFlightMode("AUTO")}>자동비행시작</button>
                        </div>
                    </div>
                    <div class="row g-1" style="margin-top:0px">
                        <div class="col">
                            <button type="button" class="btn btn-secondary" 
                            style="width:100%;" on:click={downloadMission} id="btnChangePlanningMode">읽어오기</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={sendCommands}>화면초기화</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={() => changeFlightMode("GUIDED")}>자동비행중지</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Message droneID={droneID} />

{#if planningMode === true}
    <div class="footer black-translucent-bg" id="list-command" style="height: 200px;">
        <div class="container-fluid" style="height:100%">
            <div class="row">
                <div class="col" style="margin-bottom:10px;">
                    <span>고도타입</span>
                    <select id="missionAltType" bind:value={missionAltType}>
                        <option value="relative" selected>relative</option>
                        <option value="absolute">absolute</option>
                        <option value="terrain">terrain</option>
                    </select>
                    <span style="margin-left:10px;">임무고도</span>
                    <input type="number" bind:value={missionAlt} placeholder="임무고도" style="width:50px;">
                    <span style="margin-left:10px;">인정범위</span>
                    <input type="number" bind:value={missionRadius} placeholder="인정범위" style="width:50px;">
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <div class="table-responsive d-flex justify-content-center">
                        <table class="table" style="width:100%">
                          <thead>
                            <tr>
                                <th class="align-middle p-0 gray-translucent-bg" style="width:8%;">No</th>
                                <th class="align-middle p-0 gray-translucent-bg">Commnad</th>
                                <th class="align-middle p-0 gray-translucent-bg">Delay</th>
                                <th class="align-middle p-0 gray-translucent-bg">Latitude</th>
                                <th class="align-middle p-0 gray-translucent-bg">Longitude</th>
                                <th class="align-middle p-0 gray-translucent-bg">altitude</th>
                                <th class="align-middle p-0 gray-translucent-bg">고도타입</th>
                                <th class="align-middle p-0 gray-translucent-bg">삭제</th>
                            </tr>
                          </thead>
                          <tbody>
                            <!-- 반복되는 행들 -->
            {#each commands as command, index}
                            <tr>
                                <td class="align-middle p-0 black-translucent-bg" style="width:8%;">{index+1}</td>
                                <td class="align-middle p-0 black-translucent-bg">
                                    <select name="command" style="width:100%;height:100%" bind:value={command.command}>
                                        <option value="waypoint" selected>waypoint</option>
                                        <option value="land">land</option>
                                    </select>
                                </td>
                                <td class="align-middle p-0 black-translucent-bg"><input type="number" name="delay" bind:value={command.delay} style="width:50px;"></td>
                                <td class="align-middle p-0 black-translucent-bg">{command.latitude}</td>
                                <td class="align-middle p-0 black-translucent-bg">{command.longitude}</td>
                                <td class="align-middle p-0 black-translucent-bg"><input type="number" name="altitude" bind:value={command.altitude} on:keyup={handleChangeCommand} style="width:50px;"></td>
                                <td class="align-middle p-0 black-translucent-bg">
                                    <select name="altitudeType" style="width:100%;height:100%" bind:value={command.altitudeType}>
                                        <option value="relative" selected>relative</option>
                                        <option value="absolute">absolute</option>
                                        <option value="terrain">terrain</option>
                                    </select>
                                </td>
                                <td class="align-middle p-0 black-translucent-bg"><button type="button" class="btn btn-secondary" on:click={() => delCommand(index)}>삭제</button></td>
                            </tr>
            {/each}
                            <!-- 추가 행들 -->
                          </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}


{/if}

<style>
* {font-size:0.96em;}

.footer {
    position: fixed; /* 고정 위치 지정 */
    bottom: 10px; /* 하단에 위치 */
    left:10px;
    right: 420px;
    background-color: #f8f9fa; /* 배경 색상 */
    text-align: center; /* 텍스트 가운데 정렬 */
    padding: 10px 0; /* 상하 패딩 */
}

.black-translucent-bg {
    color:white;
    background:rgba(0,0,0,0.8);
    padding:5px;
    text-align:center
}

.gray-translucent-bg {
    color:white;
    background:rgba(50,50,50,0.8);
    padding:3px;
    text-align:center;
}


.table-responsive tbody {
  display: block;
  max-height: 120px; /* 원하는 높이 설정 */
  overflow-y: auto;
}

.table-responsive thead, .table-responsive tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.table-responsive thead {
  width: calc(100% - 1em); /* 스크롤바 너비 조정 */
}

th {font-size:1em;}
</style>

