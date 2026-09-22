const fs = require('fs');
const PNG = require('pngjs').PNG;

const frontPng = PNG.sync.read(fs.readFileSync('assets/anatomy_front_realistic.png'));
const backPng = PNG.sync.read(fs.readFileSync('assets/anatomy_back_realistic.png'));

function isSafe(png, x, y) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || xi >= png.width || yi < 0 || yi >= png.height) return false;
    return png.data[(png.width * yi + xi) * 4 + 3] >= 120;
}

function optimizePolygon(png, poly, name) {
    // 1. Compute centroid
    let cx = 0, cy = 0;
    poly.forEach(p => { cx += p[0]; cy += p[1]; });
    cx /= poly.length;
    cy /= poly.length;

    // 2. Adjust points inward if not safe
    const adjusted = poly.map(p => {
        let [x, y] = p;
        let dx = cx - x, dy = cy - y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;

        while (!isSafe(png, x, y)) {
            x += dx * 2;
            y += dy * 2;
        }
        // Extra 6px inset towards centroid to guarantee smooth anti-aliased safety margin
        x += dx * 6;
        y += dy * 6;
        return [Math.round(x), Math.round(y)];
    });

    // 3. Subdivide and push inward any edge point that dips outside
    let passes = 0;
    let refined = [...adjusted];
    while (passes < 4) {
        let newPoly = [];
        for (let i = 0; i < refined.length; i++) {
            const p1 = refined[i];
            const p2 = refined[(i + 1) % refined.length];
            newPoly.push(p1);

            // check multiple points along edge
            for (let t = 0.25; t <= 0.75; t += 0.25) {
                const mx = p1[0] + (p2[0] - p1[0]) * t;
                const my = p1[1] + (p2[1] - p1[1]) * t;
                if (!isSafe(png, mx, my)) {
                    let dx = cx - mx, dy = cy - my;
                    const len = Math.hypot(dx, dy) || 1;
                    dx /= len;
                    dy /= len;
                    let curX = mx, curY = my;
                    while (!isSafe(png, curX, curY)) {
                        curX += dx * 2;
                        curY += dy * 2;
                    }
                    curX += dx * 6;
                    curY += dy * 6;
                    newPoly.push([Math.round(curX), Math.round(curY)]);
                }
            }
        }
        refined = newPoly;
        passes++;
    }

    // Final safety check
    let leaks = 0;
    for (let i = 0; i < refined.length; i++) {
        const p1 = refined[i];
        const p2 = refined[(i + 1) % refined.length];
        for (let t = 0; t <= 1; t += 0.05) {
            const x = p1[0] + (p2[0] - p1[0]) * t;
            const y = p1[1] + (p2[1] - p1[1]) * t;
            if (!isSafe(png, x, y)) leaks++;
        }
    }
    console.log(`${name}: ${refined.length} points, leaks: ${leaks}`);
    return refined;
}

function toSvgPath(poly) {
    if (poly.length === 0) return '';
    return 'M ' + poly.map(p => `${p[0]} ${p[1]}`).join(' L ') + ' Z';
}

// Raw Initial Polygons for BACK (viewBox="0 0 953 1650")
const rawBack = {
    Trapezio: [
        [476, 170], [440, 200], [390, 240], [340, 275],
        [380, 290], [420, 310], [476, 375],
        [532, 310], [572, 290], [612, 275],
        [562, 240], [512, 200]
    ],
    Ombro_Left: [
        [335, 278], [275, 305], [245, 345], [255, 400],
        [285, 415], [315, 395], [335, 335]
    ],
    Ombro_Right: [
        [617, 278], [677, 305], [707, 345], [697, 400],
        [667, 415], [637, 395], [617, 335]
    ],
    Costas_Left: [
        [476, 375], [420, 340], [355, 400], [340, 420],
        [345, 470], [356, 530], [358, 590], [350, 645],
        [345, 680], [410, 690], [476, 695]
    ],
    Costas_Right: [
        [476, 375], [532, 340], [597, 400], [612, 420],
        [607, 470], [596, 530], [594, 590], [602, 645],
        [607, 680], [542, 690], [476, 695]
    ],
    Triceps_Left: [
        [252, 405], [230, 445], [198, 495], [170, 540], [148, 565],
        [180, 560], [220, 525], [255, 475], [280, 420]
    ],
    Triceps_Right: [
        [700, 405], [722, 445], [754, 495], [782, 540], [804, 565],
        [772, 560], [732, 525], [697, 475], [672, 420]
    ],
    Antebraco_Left: [
        [145, 570], [120, 615], [85, 665], [52, 715], [28, 750],
        [45, 770], [78, 745], [115, 685], [150, 625], [178, 565]
    ],
    Antebraco_Right: [
        [807, 570], [832, 615], [867, 665], [900, 715], [924, 750],
        [907, 770], [874, 745], [837, 685], [802, 625], [774, 565]
    ],
    Gluteo_Left: [
        [476, 695], [410, 690], [345, 680], [330, 725], [324, 785], [330, 840],
        [370, 868], [420, 868], [476, 865]
    ],
    Gluteo_Right: [
        [476, 695], [542, 690], [607, 680], [622, 725], [628, 785], [622, 840],
        [582, 868], [532, 868], [476, 865]
    ],
    Isquiotibial_Left: [
        [462, 880], [458, 930], [455, 980], [454, 1030], [450, 1080],
        [375, 1080], [368, 1030], [355, 980], [342, 930], [335, 880]
    ],
    Isquiotibial_Right: [
        [490, 880], [494, 930], [497, 980], [498, 1030], [502, 1080],
        [577, 1080], [584, 1030], [597, 980], [610, 930], [617, 880]
    ],
    Panturrilha_Left: [
        [378, 1140], [370, 1200], [372, 1250], [382, 1300], [392, 1350], [402, 1400], [406, 1440],
        [440, 1440], [438, 1400], [440, 1350], [445, 1300], [452, 1250], [450, 1200], [444, 1140]
    ],
    Panturrilha_Right: [
        [508, 1140], [496, 1200], [494, 1250], [502, 1300], [507, 1350], [511, 1400], [506, 1440],
        [540, 1440], [542, 1400], [552, 1350], [564, 1300], [575, 1250], [578, 1200], [573, 1140]
    ]
};

// Raw Initial Polygons for FRONT (viewBox="0 0 974 1615")
const rawFront = {
    Trapezio: [
        [487, 210], [440, 235], [380, 260], [340, 290],
        [410, 280], [487, 270],
        [564, 280], [634, 290], [594, 260], [534, 235]
    ],
    Peito_Left: [
        [487, 285], [390, 295], [340, 320], [315, 360], [330, 415], [370, 435], [487, 435]
    ],
    Peito_Right: [
        [487, 285], [584, 295], [634, 320], [659, 360], [644, 415], [604, 435], [487, 435]
    ],
    Ombro_Left: [
        [335, 290], [275, 320], [250, 360], [260, 405], [290, 420], [315, 385]
    ],
    Ombro_Right: [
        [639, 290], [699, 320], [724, 360], [714, 405], [684, 420], [659, 385]
    ],
    Bicep_Left: [
        [260, 410], [235, 460], [205, 510], [180, 550], [170, 570], [230, 560], [270, 495], [285, 425]
    ],
    Bicep_Right: [
        [714, 410], [739, 460], [769, 510], [794, 550], [804, 570], [744, 560], [704, 495], [689, 425]
    ],
    Antebraco_Left: [
        [165, 575], [140, 620], [105, 670], [65, 720], [45, 755],
        [60, 770], [95, 745], [130, 685], [165, 625], [195, 570]
    ],
    Antebraco_Right: [
        [809, 575], [834, 620], [869, 670], [909, 720], [929, 755],
        [914, 770], [879, 745], [844, 685], [809, 625], [779, 570]
    ],
    Abdomen: [
        [487, 440], [375, 445], [375, 500], [380, 560], [375, 620], [365, 675], [355, 725], [487, 745],
        [619, 725], [609, 675], [599, 620], [594, 560], [599, 500], [599, 445]
    ],
    Quad_Left: [
        [480, 755], [355, 755], [350, 800], [350, 860], [360, 920], [372, 980], [385, 1040], [390, 1080],
        [445, 1080], [455, 1040], [458, 980], [463, 920], [467, 860], [470, 800]
    ],
    Quad_Right: [
        [494, 755], [619, 755], [624, 800], [624, 860], [614, 920], [602, 980], [589, 1040], [584, 1080],
        [529, 1080], [519, 1040], [516, 980], [511, 920], [507, 860], [504, 800]
    ],
    Panturrilha_Left: [
        [374, 1130], [367, 1180], [368, 1230], [378, 1280], [388, 1340], [396, 1400], [396, 1445],
        [436, 1445], [435, 1400], [430, 1340], [438, 1280], [446, 1230], [448, 1180], [444, 1130]
    ],
    Panturrilha_Right: [
        [600, 1130], [607, 1180], [606, 1230], [596, 1280], [586, 1340], [578, 1400], [578, 1445],
        [538, 1445], [539, 1400], [544, 1340], [536, 1280], [528, 1230], [526, 1180], [530, 1130]
    ]
};

console.log('--- OPTIMIZING BACK ---');
const optBack = {};
for (const [k, v] of Object.entries(rawBack)) {
    optBack[k] = toSvgPath(optimizePolygon(backPng, v, 'Back_' + k));
}

console.log('--- OPTIMIZING FRONT ---');
const optFront = {};
for (const [k, v] of Object.entries(rawFront)) {
    optFront[k] = toSvgPath(optimizePolygon(frontPng, v, 'Front_' + k));
}

fs.writeFileSync('scratch/calibrated_svg_paths.json', JSON.stringify({ back: optBack, front: optFront }, null, 2));
console.log('Wrote scratch/calibrated_svg_paths.json successfully');
