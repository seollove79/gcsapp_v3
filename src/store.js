import  { writable } from 'svelte/store'
let apiUrl = "http://127.0.0.1:8000/api/v1/drones/"
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

let apiCallInterval = 500;
export const API_CALL_INTERVAL = writable(apiCallInterval)

let messageCallInterval = 1000;
export const MESSAGE_CALL_INTERVAL = writable(messageCallInterval)

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

let fieldLocations = [
    {latitude : 38.0803178, longitude : 127.3499334},
    {latitude : 38.0802281, longitude : 127.3516225},
    {latitude : 38.0801809, longitude : 127.3533408},
    {latitude : 38.0801195, longitude : 127.3551676},
    {latitude : 38.0800907, longitude : 127.3566067},
    {latitude : 38.0799749, longitude : 127.3581531},
];
export const FIELD_LOCATIONS = writable(fieldLocations)


let groupLocations = [
    {latitude : 38.0729230, longitude : 127.3503082},
    {latitude : 38.0727968, longitude : 127.3520230},
    {latitude : 38.0726963, longitude : 127.3534542},
    {latitude : 38.0726890, longitude : 127.3550678},
    {latitude : 38.0727409, longitude : 127.3565935},
    {latitude : 38.0728196, longitude : 127.3579571},
];
export const GROUP_LOCATIONS = writable(groupLocations)