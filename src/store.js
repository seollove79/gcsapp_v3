import  { writable } from 'svelte/store'
let apiUrl = "http://127.0.0.1:8000/"
export const DRONEKIT_API = writable(apiUrl)

let mapViewer = null;
export const MAP_VIEWER = writable(mapViewer)

let mapHandler = null;
export const MAP_HANDLER = writable(mapHandler)

let droneYawOffset = 90;
export const DRONE_YAW_OFFSET = writable(droneYawOffset)

let droneAltitudeOffset = 0;
export const DRONE_ALTITUDE_OFFSET = writable(droneAltitudeOffset)

let droneModelScale = 0.003;
export const DRONE_MODEL_SCALE = writable(droneModelScale)

let apiCallInterval = 2000;
export const API_CALL_INTERVAL = writable(apiCallInterval)

let selectedDrone = null;
export const SELECTED_DRONE = writable(selectedDrone)

let selectedDroneObject = null;
export const SELECTED_DRONE_OBJECT = writable(selectedDroneObject)

let showTakeoffInfo = false;
export const SHOW_TAKEOFF_INFO = writable(showTakeoffInfo)

let showTakeoffInfoAll = false;
export const SHOW_TAKEOFF_INFO_ALL = writable(showTakeoffInfoAll)

let showGuideAltInfo = false;
export const SHOW_GUIDE_ALT_INFO = writable(showGuideAltInfo)

let showGuideDistanceInfo = false;
export const SHOW_GUIDE_DISTANCE_INFO = writable(showGuideDistanceInfo)

let planningMode = false;
export const PLANNING_MODE = writable(planningMode)

let slAltOffset = 0;
export const SL_ALT_OFFSET = writable(slAltOffset)

let drones = [];
export const DRONES = writable(drones)