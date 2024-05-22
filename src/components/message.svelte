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
let data = null;

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

        data = await response.json();
        
        var messageDiv = document.getElementById('message-div');
        messageDiv.scrollTop = messageDiv.scrollHeight;
    } catch (error) {
        console.error(error);
    }
}
</script>




<div class="bottom-left-layer">
    <div class="container">
        <div class="row gray-translucent-bg" style="height:30px">
            <div class="col-12">
                <p style="padding-left:2px">{droneID}</p>
            </div> 
        </div>
        <div class="row black-translucent-bg" style="height:170px;overflow-y:scroll" id="message-div">
            <div class="col-12">
                {#if data !== null}
                    {#each data.message as message}
                        <p style="font-size:0.8em">{message.message}</p>
                    {/each}
                {/if}
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

.gray-translucent-bg {
    color:white;
    background:rgba(50,50,50,0.8);
    padding:3px;
    text-align:center;
}
</style>