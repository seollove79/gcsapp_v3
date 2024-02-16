<script>
    export let droneID;
    export let onSelect;
</script>

<div style="background:rgba(0,0,0,0.7);margin-right:10px" on:click={()=>onSelect(droneID)}>
    <div class="container g-0" style="width:190px;padding:5px">
        <div class="row g-3">
            <div class="col-auto"><img src="/images/q10.jpg" width="55" height="55" alt="drone icon"></div>
            <div class="col-auto">
                <div class="container-fluid g-0">
                    <div class="row g-0" style="margin-bottom:5px;">
                        <div class="col-auto" style="text-align:left">
                            <span style="font-size:1.2em;color:white">{droneID}</span>
                        </div>
                    </div>
                    <div class="row g-0">
                        <div class="col">
                            <img src="/images/icon_battery.png" height="28" alt="battery icon" style="margin-right:10px">
                            <img src="/images/icon_communication.png" height="28" alt="battery icon" style="margin-right:10px">
                            <img src="/images/icon_sattelite.png" height="28" alt="battery icon">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>