<script>
	import { onMount } from "svelte";
	import Top from "./components/top.svelte";
	import ManageDrone from "./components/manage_drone.svelte";
	import TakeoffInfo from "./components/takeoff_info.svelte";

	import {
		MAP_VIEWER,
		MAP_HANDLER,
		SELECTED_DRONE,
		DRONEKIT_API,
		SHOW_TAKEOFF_INFO,
	} from "./store";
	import * as Cesium from "cesium";

	let map3d = null;
	let drone = null;

	let entityManager = {
		guidedPositionLine: null,
		guidedPositionMarker: null,
		waypointLine: [],
		waypointMarker: [],
	};

	let manageDrone = null;

	function vwmap() {
		let controlDensity = "vw.DensityType.BASIC";
		let interactionDensity = "vw.DensityType.BASIC";

		let mapOptions = new vw.MapOptions(
			vw.BasemapType.GRAPHIC,
			"",
			eval(controlDensity),
			eval(interactionDensity),
			false,
			new vw.CameraPosition(
				new vw.CoordZ(126.621259, 37.520995, 500),
				new vw.Direction(-90, 0, 0),
			),
			new vw.CameraPosition(
				new vw.CoordZ(126.621259, 37.520995, 500),
				new vw.Direction(0, -90, 0),
			),
		);

		map3d = new vw.Map("vmap", mapOptions);
		$MAP_VIEWER = ws3d.viewer;
		$MAP_HANDLER = new Cesium.ScreenSpaceEventHandler(
			$MAP_VIEWER.scene.canvas,
		);

		$MAP_HANDLER.setInputAction(function (click) {
			if ($SELECTED_DRONE === null || $SELECTED_DRONE === undefined || $SELECTED_DRONE === "") {
				return;
			}
			let ray = $MAP_VIEWER.camera.getPickRay(click.position);
			let drone = manageDrone.drones.find(drone => drone.droneID === $SELECTED_DRONE);
			let newAlt = drone.droneStatus.droneStatus.alt;

			let cartesian = $MAP_VIEWER.scene.globe.pick(
				ray,
				$MAP_VIEWER.scene,
			);

			if (cartesian) {
				let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
				let longitude = Cesium.Math.toDegrees(cartographic.longitude);
				let latitude = Cesium.Math.toDegrees(cartographic.latitude);
				let height = cartographic.height;

				let point1 = Cesium.Cartesian3.fromDegrees(
					longitude,
					latitude,
					height,
				);
				let point2 = Cesium.Cartesian3.fromDegrees(
					longitude,
					latitude,
					height + newAlt,
				);

				let guidedPopup = document.getElementById("guidedPopup");

				guidedPopup.style.display = "block";
				guidedPopup.style.position = "absolute";
				guidedPopup.style.bottom =
					$MAP_VIEWER.canvas.clientHeight - click.position.y + "px";
				guidedPopup.style.left = click.position.x + "px";

				let btnGotoPoint = document.getElementById("btnGotoPoint");
				let btnGotoPointWithCurrentAlt = document.getElementById("btnGotoPointWithCurrentAlt");

				btnGotoPoint.onclick = () => {
					guidedPopup.style.display = "none";
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

					gotoLocation(longitude, latitude, newAlt);
				};

				btnGotoPointWithCurrentAlt.onclick = () => {
					console.log("두번째 버튼 클릭");
					guidedPopup.style.display = "none";
					if (entityManager.guidedPositionLine != null) {
						$MAP_VIEWER.entities.remove(entityManager.guidedPositionLine);
						$MAP_VIEWER.entities.remove(entityManager.guidedPositionMarker);
					}

					let point1 = Cesium.Cartesian3.fromDegrees(
						longitude,
						latitude,
						height,
					);

					let point2 = Cesium.Cartesian3.fromDegrees(
						longitude,
						latitude,
						drone.droneStatus.droneStatus.slAlt,
					);


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

					gotoLocation(longitude, latitude, height, "relative");
				};
			}
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

		$MAP_HANDLER.setInputAction(function (click) {
			let guidedPopup = document.getElementById("guidedPopup");
			guidedPopup.style.display = "none";
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}

	async function gotoLocation(longitude, latitude, height, method) {
		try {
			const response = await fetch($DRONEKIT_API + "goto_location/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					drone_id: $SELECTED_DRONE,
					longitude: longitude,
					latitude: latitude,
					altitude: height,
					method: method,
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

	async function takeoff(altitude, droneId) {
		alert("test");
	}


	onMount(async () => {
		vwmap();
	});
</script>

<div class="fullscreen-layer">
	<div id="vmap" style="width:100%;height:100%"></div>
	<Top />
	<ManageDrone bind:this={manageDrone} />
</div>

<div id="guidedPopup" class="guidedPopup" style="display:none">
	<table>
		<tr>
			<td width="20" style="background-color: #c2c2c2;"></td>
			<td style="padding:5px;background-color: white;"><button id="btnGotoPoint">이곳으로 비행</button></td>
		</tr>
		<tr>
			<td width="20" style="background-color: #c2c2c2;"></td>
			<td style="padding:5px;background-color: white;"><button id="btnGotoPointWithCurrentAlt">이곳으로 비행(현재고도 유지)</button></td>
		</tr>
	</table>
</div>

{#if $SHOW_TAKEOFF_INFO===true}
	<TakeoffInfo runTakeoff={takeoff} />
{/if}

<style>
	.fullscreen-layer {
		position: relative;
		width: 100%;
		height: 100vh;
	}

	.guidedPopup tr:hover {
		background-color: #c2c2c2;
		font-weight: bold;
		cursor: pointer;
	}
</style>
