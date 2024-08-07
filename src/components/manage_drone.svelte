<svelte:options accessors={true}/>
<script>
    import DroneLabel from "./drone_label.svelte";
    import DroneStatus from "./drone_status.svelte";
    import { DRONEKIT_API, SELECTED_DRONE, SELECTED_DRONE_OBJECT, DRONES } from "../store";
    import { create_bidirectional_transition } from "svelte/internal";

    let modal = null;
    let modalConnecting = false;
    let modalError = null;

    function openModal() {
        modalConnecting = false;
        modalError = null;
        modal = new bootstrap.Modal(
            document.getElementById("droneConnectModal"),
            {
                keyboard: false,
            },
        );
        modal.show();
    }

    function closeModal() {
        modalError = null;
        modalConnecting = false;
        modal.hide();
    }

    let formData = {
        connectType: "tcp",
        droneID: "drone#01",
        IPAddress: "192.168.0.65",
        port: "5760",
    };

    async function handleSubmit(e) {
        e.preventDefault();
        modalConnecting = true; // 연결 중 상태로 변경합니다.
        modalError = null; // 오류 상태를 초기화합니다.

        if (
            !formData.connectType ||
            !formData.IPAddress ||
            !formData.port ||
            !formData.droneID
        ) {
            alert("연결방식, 드론ID, IP주소, 포트를 입력해주세요.");
            modalConnecting = false; // 오류 발생 시 연결 중 상태를 해제합니다.
            return;
        }

        let connectionString = formData.connectType + ":" + formData.IPAddress + ":" + formData.port;

        try {
            const response = await fetch($DRONEKIT_API + "connect_drone", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    connection_string: connectionString,
                    drone_id: formData.droneID,
                }),
            });

            if (!response.ok) {
                throw new modalError("Network response was not ok.");
            }

            const data = await response.json();
            if (data.status === "Connected") {
                alert("드론이 연결되었습니다.");
                addDrone(formData.droneID, connectionString);
                closeModal();
            }

            if (data.status === "Already Connected") {
                alert("이미 연결되어 있습니다.");
                addDrone(formData.droneID, connectionString);
                closeModal();
            }

            if (data.status === "Failed") {
                modalError = data.details; // 오류 상태를 설정합니다.
            }
        } catch (error) {
            console.error("Error:", error);
            modalError = error; // 오류 상태를 설정합니다.
        } finally {
            modalConnecting = false; // 요청이 완료되면 연결 상태를 '완료'로 변경합니다.
        }
    }

    function addDrone(droneID,connectionString) {
        if (!$DRONES.some(drone => drone.droneID === droneID) && !$DRONES.some(drone => drone.connectionString === connectionString)) {
            $DRONES.push(
                {
                    droneID: droneID,
                    connectionString : connectionString,
                    droneLabel: null,
                    droneStatus: null,
                },
            );
            $DRONES = $DRONES;
        }
    }

    function selectDrone(droneID) {
        $DRONES.forEach(drone => {
            if (drone.droneID === droneID) {
                drone.droneLabel.setSelected(true);
                if (drone.droneStatus.showStatus) {
                    drone.droneStatus.setShowStatus(false);
                } else {
                    $DRONES.forEach(drone => drone.droneStatus.setShowStatus(false));
                    drone.droneStatus.setShowStatus(true);
                }
                $SELECTED_DRONE = droneID;
                $SELECTED_DRONE_OBJECT = drone;
            } else {
                drone.droneLabel.setSelected(false);
            }
        });
    }
</script>

<div class="manage-drone-layer">
    <div class="container g-0">
        <div class="row g-0">
            <div class="col d-flex">
                {#each $DRONES as drone}
                <DroneLabel droneID={drone.droneID} bind:this={drone.droneLabel} onSelect={selectDrone} />
                {/each}
            </div>
            <div class="col g-0">
                <button on:click={openModal} class="btn-add-drone">
                    <img
                        src="/images/icon_drone.png"
                        width="35"
                        height="35"
                        alt="drone icon"
                    /><p style="margin:5px 0 0 0;padding:0;font-size:0.7em">드론추가</p>
                </button>
            </div>
        </div>
    </div>
</div>
<div class="status-layer" style="gap:6px">
    {#each $DRONES as drone}
    <DroneStatus droneID={drone.droneID} bind:this={drone.droneStatus}/>
	{/each}
</div>
<div
    class="modal fade"
    id="droneConnectModal"
    tabindex="-1"
    aria-labelledby="droneConnectModalLabel"
    aria-hidden="true"
>
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="background:rgba(0,0,0,0)">
            <div class="container">
                <div
                    class="row"
                    style="height:40px;background:rgba(0,0,0,0.5);color:white"
                >
                    <div
                        class="col-11 my-auto"
                        style="text-align:center"
                    >
                        드론 연결 정보
                    </div>
                    <div
                        class="col-1 d-flex align-items-center"
                        style="text-align:center"
                    >
                        <button
                            on:click={closeModal}
                            style="background-color:black;border:0"
                            ><i
                                class="bi bi-x-square-fill"
                            ></i></button
                        >
                    </div>
                </div>
                <div class="row" style="background:rgba(100,100,100,0.7);">
                    <div class="col" style="padding:10px">
                        {#if modalConnecting === true}
                            <div style="text-align:center">
                                <div
                                    class="spinner-border text-light"
                                    style="width: 4rem; height: 4rem;"
                                    role="status"
                                >
                                    <span class="visually-hidden"
                                        >Loading...</span
                                    >
                                </div>
                            </div>
                        {:else}
                            <form
                                name="myform"
                                id="myform"
                                on:submit={handleSubmit}
                            >
                                <select
                                    class="form-select"
                                    id="connectType"
                                    aria-label="Default select example"
                                    style="margin-bottom:10px;"
                                    bind:value={formData.connectType}
                                >
                                    <option value="" selected>연결방식</option>
                                    <option value="tcp">TCP</option>
                                </select>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="droneID"
                                    placeholder="드론 ID"
                                    style="margin-bottom:10px;"
                                    bind:value={formData.droneID}
                                />
                                <input
                                    type="text"
                                    class="form-control"
                                    id="IPAddress"
                                    placeholder="IP 주소"
                                    style="margin-bottom:10px;"
                                    bind:value={formData.IPAddress}
                                />
                                <input
                                    type="number"
                                    class="form-control"
                                    id="port"
                                    placeholder="포트번호"
                                    style="margin-bottom:10px;"
                                    bind:value={formData.port}
                                />
                                <div class="container">
                                    <div class="row">
                                        <div
                                            class="col d-flex justify-content-center"
                                        >
                                            <button
                                                type="submit"
                                                class="btn btn-primary"
                                                style="margin-right:20px"
                                                >연결</button
                                            >
                                            <button
                                                type="button"
                                                class="btn btn-secondary"
                                                on:click={closeModal}
                                                >취소</button
                                            >
                                        </div>
                                    </div>
                                </div>
                            </form>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    * {
        font-size:1em;
    }

    .manage-drone-layer {
        position: fixed; /* 고정된 위치 */
        top: 60px; /* 상단에서 0px의 위치 */
        right: 10px; /* 오른쪽에서 0px의 위치 */
        z-index: 1000; /* 다른 요소들 위에 표시되도록 z-index 설정 */
    }

    .status-layer {
        position: fixed; /* 고정된 위치 */
        top: 135px; /* 상단에서 0px의 위치 */
        right: 10px; /* 오른쪽에서 0px의 위치 */
        display: flex;
        z-index:1;
        flex-direction: column;
        gap:10px;
    }

    .btn-add-drone {
        padding: 5px;
        width: 60px;
        background: black;
        border: 0;
        color: white;
    }
</style>
