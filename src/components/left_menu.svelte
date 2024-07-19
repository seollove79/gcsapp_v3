<script>
import { DRONES, SHOW_TAKEOFF_INFO_ALL, MAP_VIEWER, DRONEKIT_API, FIELD_LOCATIONS, GROUP_LOCATIONS } from "../store";
import * as Cesium from "cesium";

function takeoffAll() {
    if ($DRONES.length === 0) {
        alert("연결된 드론이 없습니다.");
        return;
    }
    $SHOW_TAKEOFF_INFO_ALL = true;
}

function changeAuto() {
    if ($DRONES.length === 0) {
        alert("연결된 드론이 없습니다.");
        return;
    }

    $DRONES.forEach(async (drone) => {
        drone.droneStatus.changeFlightMode("AUTO");
    });
}

function stopAuto() {
    if ($DRONES.length === 0) {
        alert("연결된 드론이 없습니다.");
        return;
    }

    $DRONES.forEach(async (drone) => {
        drone.droneStatus.changeFlightMode("GUIDED");
    });
}

function insertTarget() {
    let target1 = $MAP_VIEWER.entities.add({
        name: "Target1",
        position: Cesium.Cartesian3.fromDegrees(
            126.618510,    
            37.524777, 
            5
        ),
        model: {
            uri: "/tower.glb",
            scale: 1,
        },
    });

    let target2 = $MAP_VIEWER.entities.add({
        name: "Target2",
        position: Cesium.Cartesian3.fromDegrees(
            126.619029,
            37.524784,
            5
        ),
        model: {
            uri: "/tower.glb",
            scale: 1,
        },
    });

    let target3 = $MAP_VIEWER.entities.add({
        name: "Target3",
        position: Cesium.Cartesian3.fromDegrees(
            126.618402,
            37.524467,
            5
        ),
        model: {
            uri: "/tower.glb",
            scale: 1,
        },
    });

    let target4 = $MAP_VIEWER.entities.add({
        name: "Target4",
        position: Cesium.Cartesian3.fromDegrees(
            126.618952,
            37.524520, 
            5
        ),
        model: {
            uri: "/tower.glb",
            scale: 1,
        },
    });
}

function insertTarget2() {
    let boxEntity = $MAP_VIEWER.entities.add({
        name: '5m x 5m Box',
        position: Cesium.Cartesian3.fromDegrees(126.618952,37.524520,5), // 경도, 위도
        box: {
            dimensions: new Cesium.Cartesian3(5.0, 5.0, 1.0), // x, y, z 크기
            material: Cesium.Color.YELLOW,
            outline: true,
            outlineColor: Cesium.Color.BLACK
        }
    });

    // 지름3m 검은색 원 그리기
    let circleEntity = $MAP_VIEWER.entities.add({
        name: '3m Circle',
        position: Cesium.Cartesian3.fromDegrees(126.618952,37.524520,6), // 경도, 위도
        ellipse: {
            semiMinorAxis: 1.5,
            semiMajorAxis: 1.5,
            material: Cesium.Color.BLACK.withAlpha(0.5),
            outline: true,
            outlineColor: Cesium.Color.BLACK
        }
    });

    // 박스를 카메라 뷰로 줌 인
    $MAP_VIEWER.zoomTo(boxEntity);
}

function viewField() {
    $MAP_VIEWER.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(127.350952, 38.072543, 596.0) // 경도, 위도, 높이(m)
    });
}

function goField() {
    $DRONES.forEach(async (drone, index) => {
        gotoLocation(drone,index,"goField");
    });
}

function goGroup() {
    $DRONES.forEach(async (drone, index) => {
        gotoLocation(drone,index,"goGroup");
    });
}

async function gotoLocation(drone,index,command) {
    let coords;
    if(command==="goField") {
        coords = $FIELD_LOCATIONS;
    }

    if(command==="goGroup") {
        coords = $GROUP_LOCATIONS;
    }

    try {
        const response = await fetch($DRONEKIT_API + "goto_location/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                drone_id: drone.droneID,
                latitude: parseFloat(coords[index].latitude),
                longitude: parseFloat(coords[index].longitude),
                altitude: parseFloat(50),
                method: 'relative',
            }),
        });

        if (!response.ok) {
            throw new Error("서버 에러: " + response.statusText);
        }

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Error:", error);
    } finally {
    }
}
</script>

<div class="fixed-div black-translucent-bg">
    <div class="container">
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" on:click={changeAuto}>자동비행시작(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={stopAuto}>자동비행중지(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={takeoffAll}>시동&이륙(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={goGroup}>편대배치(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={goField}>작전지이동(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={insertTarget}>타겟배치</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={insertTarget2}>타겟배치2</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px" on:click={viewField}>승진훈련장</button>
            </div>
        </div>
    </div>
</div>

<style>
.fixed-div {
    position: fixed;  /* 고정 위치 설정 */
    top: 50px;           /* 상단에서 0px 위치 */
    left: 0;          /* 좌측에서 0px 위치 */
    width: 200px;     /* 너비 200px */
    background-color: #f4f4f4; /* 배경 색상 */
    padding: 5px;    /* 내부 여백 */
}

.black-translucent-bg {
    color:white;
    background:rgba(0,0,0,0.8);
    padding:5px;
    text-align:center
}

button {
    font-size:0.9em;
    width:100%;
}
</style>