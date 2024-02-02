<script>
	import { onMount } from "svelte";
	import Top from "./components/top.svelte";
	import ManageDrone from "./components/manage_drone.svelte";	
	import { MAP_VIEWER } from "./store";
	
	let map3d = null;
	let drone = null;

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
				new vw.CoordZ(126.621259, 37.520995, 1000),
				new vw.Direction(-90, 0, 0),
			),
			new vw.CameraPosition(
				new vw.CoordZ(126.621259, 37.520995, 1000),
				new vw.Direction(0, -90, 0),
			),
		);

		map3d = new vw.Map("vmap", mapOptions);
		$MAP_VIEWER = ws3d.viewer;
	}

	onMount(async () => {
		vwmap();
	});
</script>

<div class="fullscreen-layer">
	<div id="vmap" style="width:100%;height:100%"></div>
	<Top />
	<ManageDrone />
</div>

<style>
	.fullscreen-layer {
		position: relative;
		width: 100%;
		height: 100vh;
	}
</style>
