<script>
    export let display;
    export let runTakeoff;
</script>


{#if display===true}
<div
    style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;"
>
    <button
        on:click={() => {
            runTakeoff(100, 1);
        }}>test</button
    >
</div>
{/if}
<style>
</style>
