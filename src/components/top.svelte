<script>
    import LeftMenu from "./left_menu.svelte";

    let showLeftMenu=false;

    function clickMenu() {
        console.log("clickMenu");
        showLeftMenu=!showLeftMenu;
    }
</script>

<style>
.top-layer {
    height: 50px;
    width: 100%;
    position: fixed;
    display:flex;
    align-items: center;
    top: 0;
    left: 0;
    background: rgba(50, 50, 50, 0.8);
    z-index: 1000; /* 다른 요소들 위에 위치하도록 함 */
}
</style>
<div class="top-layer">
    <div class="container-fluid">
        <div class="row">
            <div class="col d-flex align-items-center">
                <button style="background:none;border:none;padding:0;" on:click={clickMenu} on:keydown={clickMenu}>
                    <i class="bi bi-justify" style="font-size:45px;color:white"></i>
                </button>
                <span style="font-size:20px;margin-left:10px;color:white;">INTOSKY Multipurpose Ground Control Station</span>
            </div>
            <div class="col d-flex align-items-center justify-content-end">
                <div class="input-group" style="width:400px;">
                    <div class="input-group-prepend">
                    <div class="input-group-text"><i class="bi bi-geo-alt-fill"></i></div>
                    </div>
                    <input type="text" class="form-control" id="inlineFormInputGroup" placeholder="주소">
                    <button class="btn btn-light"><i class="bi bi-search"></i></button>
                </div>
            </div>
        </div>
    </div>
</div>

{#if showLeftMenu===true}
<LeftMenu />
{/if}