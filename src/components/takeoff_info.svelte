<script>
    import { SHOW_TAKEOFF_INFO, SELECTED_DRONE, DRONEKIT_API } from "../store";

    let takeoffAlt=10;
    function closeWindow() {
        $SHOW_TAKEOFF_INFO = false;
    }

    async function takeoff() {
        $SHOW_TAKEOFF_INFO = true;
        if (takeoffAlt === null || takeoffAlt === "") {
            alert("이륙고도를 입력해주세요.");
            return;
        }

        if (takeoffAlt < 0) {
            alert("이륙고도는 0 이상의 숫자로 입력해주세요.");
            return;
        }

        try {
            const response = await fetch($DRONEKIT_API + "takeoff/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    drone_id: $SELECTED_DRONE,
                    target_altitude: takeoffAlt.toString(),
                }),
            });

            if (!response.ok) {
                throw new Error("서버 에러: " + response.statusText);
            }

            const data = await response.json();

            if (data.status === "start takeoff") {
                closeWindow();
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
        }
    }
</script>

<div
    class="d-flex justify-content-center align-items-center vh-100 w-100"
    style="position:fixed;top:0;left:0;background:rgba(0, 0, 0, 0.5);z-index:9999"
>
    <div class="container" style="width:400px">
        <div class="row" style="height:30px;background:rgba(0,0,0,0.5)">
            <div class="col-11 my-auto" style="text-align:center;color:white">
                이륙고도를 설정하세요. (m단위)
            </div>
            <div
                class="col-1 d-flex align-items-center"
                style="text-align:right"
            >
                <button
                    style="background:rgba(0,0,0,0);padding:0;border:0"
                    on:click={closeWindow}
                    ><i
                        class="bi bi-x-square-fill"
                        style="font-size:1.4em;color:white"
                    ></i></button
                >
            </div>
        </div>
        <div class="row" style="height:100px;background:rgba(100,100,100,0.5)">
            <div class="col-12 my-auto" style="text-align:center;color:white">
                <input
                    type="number"
                    name="takeoffAlt"
                    class="form-control"
                    id="takeoffAlt"
                    placeholder="이륙고도(m)를 입력하세요"
                    bind:value={takeoffAlt}
                    style="margin-bottom:10px;"
                />
                <button class="btn btn-primary" on:click={takeoff}>이륙</button>
            </div>
        </div>
    </div>
</div>

<style>
</style>
