<script>
    export let droneID;
    export let onSelect;
    let isSelected;

    function selectDrone() {
        onSelect(droneID);
    }

    export function setSelected(selected) {
        isSelected = selected;
    }
</script>

<div class="drone-label drone-label {isSelected ? 'selected':'no-selected'}" on:click={selectDrone} on:keydown={()=>{}}>
    <div class="container g-0" style="width:190px;padding:5px">
        <div class="row g-2">
            <div class="col-auto"><img src="/images/q10.jpg" width="55" height="55" alt="drone icon"></div>
            <div class="col-auto">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-auto" style="text-align:left;padding:0;">
                            <span style="color:white;">{droneID}</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col g-0">
                            <img src="/images/icon_battery.png" height="28" alt="battery icon" style="margin-right:5px">
                            <img src="/images/icon_communication.png" height="28" alt="battery icon" style="margin-right:5px">
                            <img src="/images/icon_sattelite.png" height="28" alt="battery icon">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    * {
        margin:0;
        padding:0;
    }

    .drone-label {
        margin-right: 10px;
        background: rgba(0, 0, 0, 0.7);
    }

    .selected {
        border:2px solid #ffff00;
    }

    .no-selected {
        border:0;
    }
</style>