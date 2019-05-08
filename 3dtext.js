
var URL = 'https://raw.githubusercontent.com/seekingmaya/etc-3D-logo/master/assets/etcetera.obj';
var container = document.querySelector(".canvasContainer");

(function() {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color();

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(new THREE.Color(), 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    var viewSize;

    // viewSize = 800;

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        viewSize = 3000;
    }

    else if (document.documentElement.clientWidth < 768) {

        viewSize = 2750;

    }

    else if (document.documentElement.clientWidth == 768 && window.matchMedia('(orientation: portrait)').matches) {
        viewSize = 2850;
    }

    else if (document.documentElement.clientWidth < 1100) {
        viewSize = 2000;
    }

    else {
        viewSize = 800;
    }

    var originalAspect;
    var windowHalfX = container.clientWidth / 2;
    var windowHalfY = container.clientHeight / 2;
    var mainObj;
    var animationID;
    var timerId;
    var idleAnimation;
    var aspectRatio = container.clientWidth / container.clientHeight;
    originalAspect = container.clientWidth / container.clientHeight;
    var camera = new THREE.OrthographicCamera(-aspectRatio * viewSize / 2, aspectRatio * viewSize / 2, viewSize / 2, -viewSize / 2, 1, 1000);

    camera.position.set(0, 0, 400);
    camera.zoom = 9;
    camera.updateProjectionMatrix();

    camera.lookAt(scene.position);

    var material = new THREE.MeshLambertMaterial({ color: 0x5A5A5A, flatShading: true });
    var objLoader = new THREE.OBJLoader();

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(-30, 194, -45);
    light.castShadow = true;
    scene.add(light);
    scene.add(light.target);
    light.target.position.set(60, 20, 0);

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 370;
    light.shadow.camera.left = -250;
    light.shadow.camera.right = 250;
    light.shadow.camera.bottom = -250;
    light.shadow.camera.top = 250;
    light.radius = 0.0039;
    light.bias = 0.0001;

    var dlight = new THREE.DirectionalLight(0xffffff, 0.7);
    dlight.position.set(20, 194, 0);
    scene.add(dlight);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;

    controls.addEventListener("change", function() {
        restartTimer();
        renderer.render(scene, camera);
    });

    objLoader.load(URL, function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        object.position.set(0, -10, 0);
        object.castShadow = true;
        object.receiveShadow = true;
        scene.add(object);
        container.appendChild(renderer.domElement);
        renderer.render(scene, camera);

        idleAnimation = function () {
            animationID = requestAnimationFrame(function animation(time) {

                object.rotation.y += Math.PI / 1440;
                renderer.render(scene, camera);

                animationID = requestAnimationFrame(animation);


            });
        }


        setTimeout(idleAnimation, 2000, object);

    });

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize(e) {

        var aspect = container.clientWidth / container.clientHeight;

        var change = originalAspect / aspect;
        var newSize = viewSize * change;
        camera.left = -aspect * newSize / 2;
        camera.right = aspect * newSize / 2;
        camera.top = newSize / 2;
        camera.bottom = -newSize / 2;


        camera.updateProjectionMatrix();
        controls.update();
        renderer.setSize(container.clientWidth, container.clientHeight);

        renderer.render(scene, camera);

    }


    function restartTimer() {
        cancelAnimationFrame(animationID);
        clearTimeout(timerId);
        timerId = setTimeout(function() {
            idleAnimation();
        }, 3000);
    }

    // function stopAnimation() {
    //     cancelAnimationFrame(animationID);
    //     clearTimeout(timerId);
    // }

})();


