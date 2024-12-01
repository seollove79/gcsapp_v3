<script>
	import { onMount } from "svelte";
	import Top from "./components/top.svelte";
	import ManageDrone from "./components/manage_drone.svelte";
	import TakeoffInfo from "./components/takeoff_info.svelte";
	import TakeoffInfoAll from "./components/takeoff_info_all.svelte";
	import GuideAltInfo from "./components/guide_alt_info.svelte";
	import GuideDistanceInfo from "./components/guide_distance_info.svelte";

	import {
		MAP_VIEWER,
		MAP_HANDLER,
		SELECTED_DRONE,
		DRONEKIT_API,
		SHOW_TAKEOFF_INFO,
		SHOW_TAKEOFF_INFO_ALL,
		SHOW_GUIDE_ALT_INFO,
		SHOW_GUIDE_DISTANCE_INFO,
		SELECTED_DRONE_OBJECT,
	} from "./store";
	import * as Cesium from "cesium";

	let map3d = null;
	
	let entityManager = {
		guidedPositionLine: null,
		guidedPositionMarker: null,
		waypointLine: [],
		waypointMarker: [],
	};

	let manageDrone = null;
		
	// 가이드 모드 목적지 위치 관리
	let guideLatitude = 0;
	let guideLongitude = 0;

	function vwmap() {
		let controlDensity = "vw.DensityType.BASIC";
		let interactionDensity = "vw.DensityType.BASIC";

		let mapOptions = new vw.MapOptions(
			vw.BasemapType.GRAPHIC,
			"",
			vw.DensityType.FULL,
        	vw.DensityType.BASIC,
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

			let cartesian = $MAP_VIEWER.scene.globe.pick(
				ray,
				$MAP_VIEWER.scene,
			);

			if (cartesian) {
				let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
				let longitude = Cesium.Math.toDegrees(cartographic.longitude);
				let latitude = Cesium.Math.toDegrees(cartographic.latitude);
				let height = cartographic.height;

				let guidedPopup = document.getElementById("guidedPopup");

				guidedPopup.style.display = "block";
				guidedPopup.style.position = "absolute";
				guidedPopup.style.bottom = $MAP_VIEWER.canvas.clientHeight - click.position.y + "px";
				guidedPopup.style.left = click.position.x + "px";

				let btnGotoPoint = document.getElementById("btnGotoPoint");
				let btnGotoPointWithCurrentAlt = document.getElementById("btnGotoPointWithCurrentAlt");
				let btnGotoPointWithDistance = document.getElementById("btnGotoPointWithDistance");

				btnGotoPoint.onclick = () => {
					guidedPopup.style.display = "none";
					guideLatitude = latitude;
					guideLongitude = longitude;
					$SHOW_GUIDE_ALT_INFO = true;
				};

				btnGotoPointWithCurrentAlt.onclick = () => {
					guidedPopup.style.display = "none";
					if (entityManager.guidedPositionLine != null) {
						$MAP_VIEWER.entities.remove(entityManager.guidedPositionLine);
						$MAP_VIEWER.entities.remove(entityManager.guidedPositionMarker);
					}

					let point1 = Cesium.Cartesian3.fromDegrees(
						longitude,
						latitude,
					);

					let point2 = Cesium.Cartesian3.fromDegrees(
						longitude,
						latitude,
						parseFloat($SELECTED_DRONE_OBJECT.droneStatus.callDroneStatus().homeAlt) + parseFloat($SELECTED_DRONE_OBJECT.droneStatus.callDroneStatus().alt),
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

					gotoLocation(latitude, longitude, $SELECTED_DRONE_OBJECT.droneStatus.callDroneStatus().alt, "relative");

				};

				btnGotoPointWithDistance.onclick = () => {
					guidedPopup.style.display = "none";
					guideLatitude = latitude;
					guideLongitude = longitude;
					$SHOW_GUIDE_DISTANCE_INFO = true;
				};
			}
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

		$MAP_HANDLER.setInputAction(function (click) {
			let guidedPopup = document.getElementById("guidedPopup");
			guidedPopup.style.display = "none";

			// 클릭한 곳 좌표 가져오기
			if($SELECTED_DRONE_OBJECT === null || $SELECTED_DRONE_OBJECT === undefined) {
				return;
			} else {
				if($SELECTED_DRONE_OBJECT.droneStatus.getPlanningMode() === true) {
					let ray = $MAP_VIEWER.camera.getPickRay(click.position);
					let cartesian = $MAP_VIEWER.scene.globe.pick(
						ray,
						$MAP_VIEWER.scene,
					);
					let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
					let longitude = Cesium.Math.toDegrees(cartographic.longitude);
					let latitude = Cesium.Math.toDegrees(cartographic.latitude);
					$SELECTED_DRONE_OBJECT.droneStatus.makeFlightPlan(latitude, longitude);
				}
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}

	async function gotoLocation(latitude, longitude, altitude, method) {
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
					altitude: altitude.toString(),
					method: method,
				}),
			});

			if (!response.ok) {
				throw new Error("서버 에러: " + response.statusText);
			}
			const data = await response.json();
		} catch (error) {
			console.error("Error:", error);
		} finally {
		}
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
		<tr>
			<td width="20" style="background-color: #c2c2c2;"></td>
			<td style="padding:5px;background-color: white;"><button id="btnGotoPointWithDistance">이곳으로 비행(지면거리 유지)</button></td>
		</tr>
	</table>
</div>

{#if $SHOW_TAKEOFF_INFO===true}
	<TakeoffInfo />
{/if}

{#if $SHOW_TAKEOFF_INFO_ALL===true}
	<TakeoffInfoAll />
{/if}

{#if $SHOW_GUIDE_ALT_INFO===true}
	<GuideAltInfo latitude={guideLatitude} longitude={guideLongitude} entityManager={entityManager} />
{/if}

{#if $SHOW_GUIDE_DISTANCE_INFO===true}
	<GuideDistanceInfo latitude={guideLatitude} longitude={guideLongitude} entityManager={entityManager} />
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
