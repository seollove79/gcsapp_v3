import  { writable } from 'svelte/store'
let apiUrl = "http://192.168.0.66:8000/"
export const DRONEKIT_API = writable(apiUrl)

let mapViewer = null;
export const MAP_VIEWER = writable(mapViewer)

let droneYawOffset = 90;
export const DRONE_YAW_OFFSET = writable(droneYawOffset)

let droneAltitudeOffset = 6;
export const DRONE_ALTITUDE_OFFSET = writable(droneAltitudeOffset)

let droneModelScale = 0.008;
export const DRONE_MODEL_SCALE = writable(droneModelScale)

let apiCallInterval = 500;
export const API_CALL_INTERVAL = writable(apiCallInterval)