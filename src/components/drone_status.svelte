<script>
    import { onMount, onDestroy, beforeUpdate, afterUpdate, tick } from 'svelte'
    import { DRONEKIT_API, MAP_VIEWER, DRONE_YAW_OFFSET, DRONE_MODEL_SCALE, API_CALL_INTERVAL, DRONE_ALTITUDE_OFFSET } from "../store";
    export let droneID;
    import * as Cesium from "cesium";

    let drone = null;
    let intervalInstance = null;

    onMount(() => {
        if (intervalInstance === null) {
            intervalInstance = setInterval(getDroneStatus, $API_CALL_INTERVAL);
        }
    });

    let droneStatus = {
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
    };

    function getDroneStatus() {
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
                if (ekf_ok === "True") {
                    ekf_ok = "EKF OK";
                } else {
                    ekf_ok = "EKF Error";
                }

                let armed = data["Armed"];
                if (armed === "True") {
                    armed = "ARMED";
                } else {
                    armed = "DISARMED";
                }

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
                };
                droneStatus = droneStatus;
                viewDrone();
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    function armDrone() {
        fetch($DRONEKIT_API + "arm_drone/" + encodeURIComponent(droneID), {
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
                if (ekf_ok === "True") {
                    ekf_ok = "EKF OK";
                } else {
                    ekf_ok = "EKF Error";
                }

                let armed = data["Armed"];
                if (armed === "True") {
                    armed = "ARMED";
                } else {
                    armed = "DISARMED";
                }

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
                };
                droneStatus = droneStatus;
                viewDrone();
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }

    function viewDrone(){
        if (drone != null) {
            let position = Cesium.Cartesian3.fromDegrees(droneStatus.lng, droneStatus.lat, droneStatus.slAlt + $DRONE_ALTITUDE_OFFSET);
            let hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(droneStatus.yaw - $DRONE_YAW_OFFSET), droneStatus.pitch, droneStatus.roll);
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

            // let terrainProvider = Cesium.createWorldTerrain();
            // $MAP_VIEWER.terrainProvider = terrainProvider;
            // let cartographicPosition = Cesium.Cartographic.fromDegrees(droneStatus.lng, droneStatus.lat);
            // Cesium.sampleTerrainMostDetailed(terrainProvider, [cartographicPosition])
            // .then(function(updatedPositions) {
            //     // 고도 정보를 출력합니다.
            //     var height = updatedPositions[0].height;
            //     console.log('해수면 고도: ' + height + ' 미터');
            // });


            drone.position = position;
            drone.orientation = orientation;
        } else {
            drone = $MAP_VIEWER.entities.add({
                name: "Drone",
                position: Cesium.Cartesian3.fromDegrees(droneStatus.lng, droneStatus.lat, droneStatus.slAlt + $DRONE_ALTITUDE_OFFSET), // 드론의 초기 위치 (경도, 위도, 높이)
                model: {
                    uri: "/scene.gltf",
                    scale: $DRONE_MODEL_SCALE,
                },
            });
        }
    }

    
</script>

<div style="width:400px" class="status-layer">
    <div class="container">
        <div
            class="row"
            style="color:white;background:rgba(50,50,50,0.8);padding:3px;text-align:center"
        >
            <div class="col">드론ID : {droneID}</div>
        </div>
        <div
            class="row"
            style="color:white;background:rgba(0,0,0,0.8);padding:5px;text-align:center"
        >
            <div
                class="container"
                style="border:1px solid rgba(150,150,150,0.8); border-radius:5px;"
            >
                <div
                    class="row"
                    style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;"
                >
                    <div class="col">배터리</div>
                    <div class="col">GPS</div>
                    <div class="col">Telemetry</div>
                </div>
                <div class="row" style="padding:5px 0 5px 0">
                    <div class="col">{droneStatus.voltage}<br />{droneStatus.level}</div>
                    <div class="col">{droneStatus.gps}<br />{droneStatus.gpsFix}</div>
                    <div class="col">99%<br />25%</div>
                </div>
            </div>
            <div class="container">
                <div
                    class="row"
                    style="padding:5px 0 4px 0;color:yellow"
                >
                    <div class="col">{droneStatus.armed}</div>
                    <div class="col">{droneStatus.mode}</div>
                    <div class="col">{droneStatus.ekf}</div>
                </div>
            </div>
            <div
                class="container"
                style="border:1px solid rgba(150,150,150,0.8); border-radius:5px;"
            >
                <div class="row">
                    <div
                        class="col g-0"
                        style="border-right:1px solid rgba(150,150,150,0.8);"
                    >
                        <div class="container">
                            <div
                                class="row"
                                style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;"
                            >
                                <div class="col">고도 (m)</div>
                            </div>
                            <div
                                class="row"
                                style="padding:5px 0 5px 0">
                                <div class="col">상대고도<br />{droneStatus.alt}</div>
                                <div class="col">해수면고도<br />{droneStatus.slAlt}</div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="col g-0"
                        style="border-right:1px solid rgba(150,150,150,0.8);"
                    >
                        <div class="container">
                            <div
                                class="row"
                                style="background:rgba(50,50,50,0.8);padding:3px 0 3px 0;"
                            >
                                <div class="col">속도 (m/s)</div>
                            </div>
                            <div
                                class="row"
                                style="padding:5px 0 5px 0"
                            >
                                <div class="col">Air<br />{droneStatus.airSpeed}</div>
                                <div class="col">Ground<br />{droneStatus.groundSpeed}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- 명령 패널 시작 -->
<div style="width:400px" class="status-layer">
    <div class="container">
        <div
            class="row"
            style="color:white;background:rgba(50,50,50,0.8);padding:3px;text-align:center"
        >
            <div class="col">제어명령 ({droneID})</div>
        </div>
        <div
            class="row"
            style="color:white;background:rgba(0,0,0,0.8);padding:5px;text-align:center"
        >
            <div class="container p-0">
                <div class="row g-1">
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">시동/종료</button>
                    </div>
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">이륙</button
                        >
                    </div>
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">착륙</button
                        >
                    </div>
                </div>
                <div class="row g-1" style="margin-top:5px">
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">LOITER</button
                        >
                    </div>
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">ALT HOLD</button
                        >
                    </div>
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">STABILIZE</button
                        >
                    </div>
                </div>
                <div class="row g-1" style="margin-top:1px">
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">GUIDED</button
                        >
                    </div>
                    <div class="col">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            style="width:100%">AUTO</button
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
</style>
