import  { writable } from 'svelte/store'
let apiUrl = "http://127.0.0.1:8000/"
export const DRONEKIT_API = writable(apiUrl)

let mapViewer = null;
export const MAP_VIEWER = writable(mapViewer)

let mapHandler = null;
export const MAP_HANDLER = writable(mapHandler)

let droneYawOffset = 90;
export const DRONE_YAW_OFFSET = writable(droneYawOffset)

let droneAltitudeOffset = 5;
export const DRONE_ALTITUDE_OFFSET = writable(droneAltitudeOffset)

let droneModelScale = 0.005;
export const DRONE_MODEL_SCALE = writable(droneModelScale)

let apiCallInterval = 100;
export const API_CALL_INTERVAL = writable(apiCallInterval)

let selectedDrone = null;
export const SELECTED_DRONE = writable(selectedDrone)

let showTakeoffInfo = false;
export const SHOW_TAKEOFF_INFO = writable(showTakeoffInfo)