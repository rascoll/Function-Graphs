document.getElementById("draw-button").addEventListener("click", drawGraph);

function drawGraph() {
    const functionInput = document.getElementById("function-input").value;
    const errorMessage = document.getElementById("error-message");
    const graphContainer = document.getElementById("graph-container");

    errorMessage.textContent = '';
    clearGraph(graphContainer);
    let func;
    try {
        func = math.compile(functionInput);
    } catch (e) {
        errorMessage.textContent = "Geçersiz fonksiyon ifadesi. Lütfen doğru bir ifade girin.";
        return;
    }
    const variables = func.toString().match(/[a-zA-Z]+/g);
    const uniqueVariables = [...new Set(variables)];
    if (uniqueVariables.length === 1) {
        draw2DGraph(func, uniqueVariables[0]);
    } else if (uniqueVariables.length === 2) {
        draw3DGraph(func);
    } else if (uniqueVariables.length === 3) {
        draw3DSurface(func);
    } else {
        errorMessage.textContent = "Fonksiyon yalnızca bir, iki veya üç değişken içerebilir.";
    }
}

function clearGraph(graphContainer) {
    while (graphContainer.firstChild) {
        graphContainer.removeChild(graphContainer.firstChild);
    }
}

function draw2DGraph(func, variable) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const graphContainer = document.getElementById('graph-container');
    graphContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;
    const xMin = -10;
    const xMax = 10;
    const yMin = -10;
    const yMax = 10;

    function toCanvasX(x) {
        return (x - xMin) / (xMax - xMin) * width;
    }

    function toCanvasY(y) {
        return height - (y - yMin) / (yMax - yMin) * height;
    }

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    ctx.moveTo(toCanvasX(xMin), toCanvasY(0));
    ctx.lineTo(toCanvasX(xMax), toCanvasY(0));

    ctx.moveTo(toCanvasX(0), toCanvasY(yMin));
    ctx.lineTo(toCanvasX(0), toCanvasY(yMax));

    ctx.stroke();

    ctx.beginPath();
    try {
        ctx.moveTo(toCanvasX(xMin), toCanvasY(func.evaluate({ [variable]: xMin })));

        for (let x = xMin; x <= xMax; x += 0.01) {
            const y = func.evaluate({ [variable]: x });
            if (y !== undefined && isFinite(y)) {
                ctx.lineTo(toCanvasX(x), toCanvasY(y));
            }
        }

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (error) {
        document.getElementById("error-message").textContent = "Geçersiz fonksiyon ifadesi. Lütfen doğru bir ifade girin.";
    }
}

function draw3DGraph(func) {
    const graphContainer = document.getElementById("graph-container");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, graphContainer.clientWidth / graphContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(graphContainer.clientWidth, graphContainer.clientHeight);
    graphContainer.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(50, 50, 50);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const xMin = -10, xMax = 10, yMin = -10, yMax = 10;
    const step = 0.5;

    for (let x = xMin; x <= xMax; x += step) {
        for (let y = yMin; y <= yMax; y += step) {
            const z = evaluateFunction(func, x, y);
            vertices.push(x, y, z);
        }
    }

    const verticesFloat32Array = new Float32Array(vertices);
    geometry.setAttribute('position', new THREE.BufferAttribute(verticesFloat32Array, 3));

    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.z = 30;

    function animate() {
        requestAnimationFrame(animate);
        points.rotation.x += 0.01;
        points.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

function draw3DSurface(func) {
    const graphContainer = document.getElementById("graph-container");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, graphContainer.clientWidth / graphContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(graphContainer.clientWidth, graphContainer.clientHeight);
    graphContainer.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(50, 50, 50);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const geometry = new THREE.ParametricGeometry((u, v, vec) => {
        const x = u * 10 - 5;
        const y = v * 10 - 5;
        const z = evaluateFunction(func, x, y);
        vec.set(x, y, z);
    }, 50, 50);

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const surface = new THREE.Mesh(geometry, material);
    scene.add(surface);

    camera.position.z = 20;
    function animate() {
        requestAnimationFrame(animate);
        surface.rotation.x += 0.01;
        surface.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

function evaluateFunction(func, x, y) {
    try {
        return func.evaluate({ x, y });
    } catch (e) {
        console.error(e);
        throw new Error("Geçersiz fonksiyon");
    }
}

