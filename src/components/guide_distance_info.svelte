<script>
    import * as Cesium from "cesium";
    import { SHOW_GUIDE_DISTANCE_INFO, SELECTED_DRONE, DRONEKIT_API, SELECTED_DRONE_OBJECT, MAP_VIEWER} from "../store";
    
    let distance = 10;
    export let latitude = 0;
    export let longitude = 0;
    export let entityManager = null;
    function closeWindow() {
        $SHOW_GUIDE_DISTANCE_INFO = false;
    }

    async function gotoLocation() {
        $SHOW_GUIDE_DISTANCE_INFO = true;
        let homeAlt = $SELECTED_DRONE_OBJECT.droneStatus.droneStatus.homeAlt;
        if (distance === null || distance === "") {
            alert("지면과의 거리를 입력하세요.");
            return;
        }

        if (distance < 0) {
            alert("지면과의 거리는 0 이상의 숫자로 입력해주세요.");
            return;
        }

        let point1 = Cesium.Cartesian3.fromDegrees(
            longitude,
            latitude,
        );

        //목표지점의 해발고도를 구하고, 거리를 더해준다.
        let cartographicPosition = Cesium.Cartographic.fromDegrees(parseFloat(longitude), parseFloat(latitude));
        let globe = $MAP_VIEWER.scene.globe;
        let height = globe.getHeight(cartographicPosition);
        let targetAltitude = height + distance;

        let point2 = Cesium.Cartesian3.fromDegrees(
            longitude,
            latitude,
            targetAltitude,
        );

        if (entityManager.guidedPositionLine != null) {
            $MAP_VIEWER.entities.remove(entityManager.guidedPositionLine);
            $MAP_VIEWER.entities.remove(entityManager.guidedPositionMarker);
        }

        // 선 그리기
        entityManager.guidedPositionLine = $MAP_VIEWER.entities.add({
            polyline: {
                positions: [point1, point2],
                width: 2,
                color: Cesium.Color.RED,
            },
        });

        entityManager.guidedPositionMarker = $MAP_VIEWER.entities.add({
            position: point2,
            point: {
                pixelSize: 15,
                color: Cesium.Color.YELLOW,
            },
        });

        try {
            const response = await fetch($DRONEKIT_API + "goto_location/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    drone_id: $SELECTED_DRONE,
                    latitude: latitude,
                    longitude: longitude,
                    altitude: targetAltitude - homeAlt,
                    method: 'relative',
                }),
            });

            if (!response.ok) {
                throw new Error("서버 에러: " + response.statusText);
            }

            const data = await response.json();
            console.log(data);
            closeWindow();
        } catch (error) {
            console.error("Error:", error);
        } finally {
        }
    }
</script>

<div
    class="d-flex justify-content-center align-items-center vh-100 w-100"
    style="position:fixed;top:0;left:0;background:rgba(0, 0, 0, 0.5);z-index:9999"
>
    <div class="container" style="width:400px">
        <div class="row" style="height:30px;background:rgba(0,0,0,0.5)">
            <div class="col-11 my-auto" style="text-align:center;color:white">
                가이드모드 지면과의 거리를 입력하세요. (m단위)
            </div>
            <div
                class="col-1 d-flex align-items-center"
                style="text-align:right"
            >
                <button
                    style="background:rgba(0,0,0,0);padding:0;border:0"
                    on:click={closeWindow}
                    ><i
                        class="bi bi-x-square-fill"
                        style="font-size:1.4em;color:white"
                    ></i></button
                >
            </div>
        </div>
        <div class="row" style="height:100px;background:rgba(100,100,100,0.5)">
            <div class="col-12 my-auto" style="text-align:center;color:white">
                <input
                    type="number"
                    name="distance"
                    class="form-control"
                    id="distance"
                    placeholder="지면과의 거리를 입력하세요.(m)"
                    bind:value={distance}
                    style="margin-bottom:10px;"
                />
                <button class="btn btn-primary" on:click={gotoLocation}>비행시작</button>
            </div>
        </div>
    </div>
</div>

<style>
</style>
