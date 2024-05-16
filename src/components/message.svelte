<script>
import {
    onMount,
} from "svelte";

import {
    DRONEKIT_API,
    MESSAGE_CALL_INTERVAL,
} from "../store";
export let droneID;
let intervalInstance = null;
let messageArray = [];

onMount(() => {
    if (intervalInstance === null) {
        intervalInstance = setInterval(getMessage, $MESSAGE_CALL_INTERVAL);
    }
});

async function getMessage() {
    try {
        const response = await fetch($DRONEKIT_API + "download_message/" + encodeURIComponent(droneID), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("서버 에러: " + response.statusText);
        }

        const data = await response.json();
        console.log(data.message);

    } catch (error) {
        console.error(error);
    }
}
</script>




<div class="bottom-left-layer black-translucent-bg">
    <div class="container">
        <div class="row">
            <div class="col-12">
                <p>{droneID}</p>
            </div> 
        </div>
        <div class="row">
            <div class="col-12">
                <p>Message</p>
            </div>
        </div>
    </div>
</div>
    
<style>
.bottom-left-layer {
    position: fixed;   /* 화면에 고정 */
    right: 10px;           /* 화면의 왼쪽 가장자리에 위치 */
    bottom: 10px;         /* 화면의 아래쪽 가장자리에 위치 */
    width: 400px;      /* 레이어의 너비 */
    height: 200px;     /* 레이어의 높이 */
    z-index: 1000;     /* 다른 요소 위에 위치하도록 z-index 설정 */
}

.black-translucent-bg {
    color:white;
    background:rgba(0,0,0,0.8);
}
</style>