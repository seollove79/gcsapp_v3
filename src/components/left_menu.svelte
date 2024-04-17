<script>

</script>

<div class="fixed-div black-translucent-bg">
    <div class="container">
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary">자동비행시작(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px">자동비행중지(전체)</button>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <button class="btn btn-secondary" style="margin-top:3px">이륙(전체)</button>
            </div>
        </div>
    </div>
</div>

<style>
.fixed-div {
    position: fixed;  /* 고정 위치 설정 */
    top: 50px;           /* 상단에서 0px 위치 */
    left: 5px;          /* 좌측에서 0px 위치 */
    width: 200px;     /* 너비 200px */
    background-color: #f4f4f4; /* 배경 색상 */
    padding: 5px;    /* 내부 여백 */
}

.black-translucent-bg {
    color:white;
    background:rgba(0,0,0,0.8);
    padding:5px;
    text-align:center
}

.gray-translucent-bg {
    color:white;
    background:rgba(50,50,50,0.8);
    padding:3px;
    text-align:center;
}

button {
    width:100%;
}
</style>