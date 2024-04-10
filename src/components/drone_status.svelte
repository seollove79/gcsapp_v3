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
    } from "../store";
    export let droneID;
    let showStatus = false;
    export let planningMode = false;
    export function getPlanningMode() {
        return planningMode;
    }

    import * as Cesium from "cesium";

    let drone = null;
    let intervalInstance = null;
    export let missionAlt = 30;
    export let missionAltType = "relative";
    export let missionRadius = 2.00;   
    export function setShowStatus(value) {
        showStatus = value;
    }

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

                let splitHome = data["Home"].split(":");
                splitHome = splitHome[1];
                splitHome = splitHome.split(",");
                let lat = splitHome[0];
                let lon = splitHome[1];
                let alt = splitHome[2];
                homeLat = lat.split("=")[1];
                homeLng = lon.split("=")[1];
                homeAlt = alt.split("=")[1];

                let cartographicPosition = Cesium.Cartographic.fromDegrees(parseFloat(homeLng), parseFloat(homeLat));
                let globe = $MAP_VIEWER.scene.globe;
                let height = globe.getHeight(cartographicPosition);
                calSLAlt = height + parseFloat(data["Alt"]); //홈포지션의 해수면고도 + 상대고도
               
                droneStatus = {
                    airSpeed: parseFloat(data["AirSpeed"]).toFixed(2),
                    groundSpeed: parseFloat(data["GroundSpeed"]).toFixed(2),
                    voltage: voltage + "V",
                    level: level + "%",
                    mode: data["Mode"],
                    gps: gps,
                    gpsFix: gpsFix,
                    armed: armed,
                    ekf: ekf_ok,
                    lat: data["Lat"],
                    lng: data["Lng"],
                    alt: data["Alt"],
                    slAlt: data["SL_Alt"],
                    roll: data["Roll"],
                    pitch: data["Pitch"],
                    yaw: data["Yaw"],
                    home: data["Home"],
                    homeAlt : height,
                    calSLAlt: calSLAlt,
                };

                droneStatus = droneStatus;
                viewDrone();
                if (showStatus === true) {
                    //moveMap();
                }
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

    async function changeFlightMode(newMode) {
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
                    uri: "/scene.gltf",
                    scale: $DRONE_MODEL_SCALE,
                },
            });
        }
    }

    export function verticalView() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.slAlt + $DRONE_ALTITUDE_OFFSET,
        );

        // 드론의 수직 위치에서 20미터 위를 계산
        var cameraPosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.slAlt + $DRONE_ALTITUDE_OFFSET + 20, // 드론 위치 + 20미터
        );

        // 카메라가 드론을 바라보는 방향으로 orientation을 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            Cesium.Math.toRadians(-90), // 20도 아래를 바라봄 (음수는 위로, 양수는 아래로)
            Cesium.Cartesian3.distance(cameraPosition, dronePosition) // 카메라와 드론 사이의 거리
        );

        $MAP_VIEWER.camera.flyTo({
            destination: cameraPosition, // 수정된 카메라 위치
            orientation: hpr,
            duration: 1,
            easingFunction: Cesium.EasingFunction.LINEAR_NONE,
        });
    }

    export function tailView() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.calSLAlt,
        );

        // 드론의 현재 위치를 바라보는 카메라의 orientation 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            droneStatus.pitch,
            10, // 5미터 뒤에서 드론을 바라봄
        );

        var cameraPosition = $MAP_VIEWER.camera.positionWC;

        $MAP_VIEWER.camera.flyTo({
            destination: dronePosition,
            orientation: hpr,
            duration: 1,
            easingFunction: Cesium.EasingFunction.LINEAR_NONE,
            complete: function () {
                //카메라가 목적지에 도착한 후, 드론 뒤로 5미터 이동한 위치를 다시 계산하여 카메라를 조정
                $MAP_VIEWER.camera.lookAt(
                    dronePosition,
                    new Cesium.HeadingPitchRange(
                        Cesium.Math.toRadians(droneStatus.yaw),
                        0,
                        10,
                    ),
                );

                // 카메라 제어를 복원
                $MAP_VIEWER.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            },
        });
    }

    export function fpvView() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.slAlt,
        );

        // 드론의 수직 위치에서 20미터 위를 계산
        var cameraPosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.slAlt, // 드론 위치 + 20미터
        );

        // 드론의 현재 위치를 바라보는 카메라의 orientation 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            droneStatus.pitch,
            10, // 10미터 뒤에서 드론을 바라봄
        );

        $MAP_VIEWER.camera.flyTo({
            destination: cameraPosition, // 수정된 카메라 위치
            orientation: hpr,
            duration: 1,
            easingFunction: Cesium.EasingFunction.LINEAR_NONE,
        });
    }


    function moveMap() {
        var dronePosition = Cesium.Cartesian3.fromDegrees(
            droneStatus.lng,
            droneStatus.lat,
            droneStatus.slAlt + $DRONE_ALTITUDE_OFFSET,
        );

        // 드론의 현재 위치를 바라보는 카메라의 orientation 계산
        var hpr = new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(droneStatus.yaw),
            droneStatus.pitch,
            10, // 5미터 뒤에서 드론을 바라봄
        );

        var cameraPosition = $MAP_VIEWER.camera.positionWC;
        var distance = Cesium.Cartesian3.distance(
            cameraPosition,
            dronePosition,
        );

        // 거리가 10미터 이상 차이가 나면 카메라 이동
        if (distance > 20) {
            $MAP_VIEWER.camera.flyTo({
                destination: dronePosition,
                orientation: hpr,
                duration: 2,
                easingFunction: Cesium.EasingFunction.LINEAR_NONE,
                complete: function () {
                    // 카메라가 목적지에 도착한 후, 드론 뒤로 5미터 이동한 위치를 다시 계산하여 카메라를 조정
                    $MAP_VIEWER.camera.lookAt(
                        dronePosition,
                        new Cesium.HeadingPitchRange(
                            Cesium.Math.toRadians(droneStatus.yaw),
                            0,
                            10,
                        ),
                    );
                },
            });
        } else {
            //카메라가 이미 드론과 가까운 경우, 바로 lookAt을 사용하여 조정
            $MAP_VIEWER.camera.lookAt(
                dronePosition,
                new Cesium.HeadingPitchRange(
                    Cesium.Math.toRadians(Math.floor(droneStatus.yaw)),
                    0,
                    10,
                ),
            );
        }
    }

    function takeoff() {
        $SHOW_TAKEOFF_INFO = true;
    }

    function changePlanningMode() {
        planningMode = !planningMode;
    }

    export function makeFlightPlan(latitude, longitude) {
        commands.push({
            command: "waypoint",
            latitude: latitude,
            longitude: longitude,
            altitude: missionAlt,
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

            let point2 = Cesium.Cartesian3.fromDegrees(
                command.longitude,
                command.latitude,
                droneStatus.homeAlt + command.altitude,
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

    function sendCommands() {
        console.log(commands);
        // fetch($DRONEKIT_API + "send_commands/" + encodeURIComponent(droneID), {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //         commands: commands,
        //     }),
        // })
        //     .then((response) => response.json())
        //     .then((data) => {
        //         console.log(data);
        //     })
        //     .catch((error) => {
        //         console.error("Error:", error);
        //     });
    }
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
                            {droneStatus.voltage}<br />{droneStatus.level}
                        </div>
                        <div class="col">
                            {droneStatus.gps}<br />{droneStatus.gpsFix}
                        </div>
                        <div class="col">99%<br />25%</div>
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
                                    <div class="col">
                                        상대고도<br />{droneStatus.alt}
                                    </div>
                                    <div class="col">
                                        해수면고도<br />{droneStatus.slAlt}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col g-0" style="border-right:1px solid rgba(150,150,150,0.8);">
                            <div class="container">
                                <div class="row" style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;">
                                    <div class="col">속도 (m/s)</div>
                                </div>
                                <div class="row" style="padding:5px 0 5px 0">
                                    <div class="col">
                                        Air<br />{droneStatus.airSpeed}
                                    </div>
                                    <div class="col">
                                        Ground<br />{droneStatus.groundSpeed}
                                    </div>
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
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={verticalView}>위에서 보기</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={tailView}>뒤에서 보기</button>
                        </div>
                        <div class="col">
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={fpvView}>FPV 시점</button>
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
                    <div class="row g-1" style="margin-top:5px">
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
                            <button type="button" class="btn btn-secondary" style="width:100%" on:click={land}>비행시작</button>
                        </div>
                    </div>
                    <div class="row g-1" style="margin-top:5px">
                        <div class="container" style="border:1px solid rgba(150,150,150,0.8); border-radius:5px;">
                            <div class="row">
                                <div class="col g-0" style="border-right:1px solid rgba(150,150,150,0.8);">
                                    <div class="container">
                                        <div class="row" style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;">
                                            <div class="col">고도타입</div>
                                        </div>
                                        <div class="row" style="padding:5px 0 5px 0">
                                            <div class="col">
                                                <select id="missionAltType" style="width:100%;height:100%" bind:value={missionAltType}>
                                                    <option value="relative" selected>relative</option>
                                                    <option value="absolute">absolute</option>
                                                    <option value="terrain">terrain</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col g-0" style="border-right:1px solid rgba(150,150,150,0.8);">
                                    <div class="container">
                                        <div class="row" style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;">
                                            <div class="col">임무고도</div>
                                        </div>
                                        <div class="row" style="padding:5px 0 5px 0">
                                            <div class="col">
                                                <input type="number" bind:value={missionAlt} placeholder="임무고도" style="width:100%;height:100%">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col g-0" style="border-right:1px solid rgba(150,150,150,0.8);">
                                    <div class="container">
                                        <div class="row" style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;">
                                            <div class="col">인정범위</div>
                                        </div>
                                        <div class="row" style="padding:5px 0 5px 0">
                                            <div class="col">
                                                <input type="number" bind:value={missionRadius} placeholder="인정범위" style="width:100%;height:100%">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>




{#if planningMode === true}
    <div class="footer black-translucent-bg" id="list-command" style="height: 170px;padding-top:10px">
        <div class="table-responsive d-flex justify-content-center">
            <table class="table" style="width:80%">
              <thead>
                <tr>
                    <th class="align-middle p-0 gray-translucent-bg">No</th>
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
                    <td class="align-middle p-0 black-translucent-bg">{index+1}</td>
                    <td class="align-middle p-0 black-translucent-bg">
                        <select name="command" style="width:100%;height:100%" bind:value={command.command}>
                            <option value="waypoint" selected>waypoint</option>
                            <option value="takeoff">takeoff</option>
                            <option value="land">land</option>
                        </select>
                    </td>
                    <td class="align-middle p-0 black-translucent-bg"><input type="number" name="delay" bind:value={command.delay}></td>
                    <td class="align-middle p-0 black-translucent-bg">{command.latitude}</td>
                    <td class="align-middle p-0 black-translucent-bg">{command.longitude}</td>
                    <td class="align-middle p-0 black-translucent-bg"><input type="number" name="altitude" bind:value={command.altitude}></td>
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
{/if}


{/if}

<style>
.footer {
    position: fixed; /* 고정 위치 지정 */
    bottom: 0; /* 하단에 위치 */
    left: 0; /* 왼쪽에 위치, 화면 전체 너비를 채우고 싶다면 right: 0;도 추가하세요 */
    width: 100%; /* 화면 전체 너비를 채움 */
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
</style>

