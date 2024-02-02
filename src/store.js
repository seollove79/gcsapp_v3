import  { writable } from 'svelte/store'
let apiUrl = "http://127.0.0.1:8000/"
export const DRONEKIT_API = writable(apiUrl)

let mapViewer = null;
export const MAP_VIEWER = writable(mapViewer)

let droneYawOffset = 90;
export const DRONE_YAW_OFFSET = writable(droneYawOffset)

let droneAltitudeOffset = 10;
export const DRONE_ALTITUDE_OFFSET = writable(droneAltitudeOffset)

let droneModelScale = 0.02;
export const DRONE_MODEL_SCALE = writable(droneModelScale)

let apiCallInterval = 500;
export const API_CALL_INTERVAL = writable(apiCallInterval)