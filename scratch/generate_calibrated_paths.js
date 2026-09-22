const fs = require('fs');
const PNG = require('pngjs').PNG;

const frontPng = PNG.sync.read(fs.readFileSync('assets/anatomy_front_realistic.png'));
const backPng = PNG.sync.read(fs.readFileSync('assets/anatomy_back_realistic.png'));

function checkPathPoints(png, pathName, points) {
    let failed = 0;
    points.forEach(([x, y]) => {
        const xi = Math.round(x);
        const yi = Math.round(y);
        const a = png.data[(png.width * yi + xi) * 4 + 3];
        if (a < 35) {
            console.log(`[LEAK] ${pathName} at (${xi}, ${yi}) alpha=${a}`);
            failed++;
        }
    });
    if (failed === 0) {
        console.log(`[PASS] ${pathName} (${points.length} points tested, 100% inside body)`);
    } else {
        console.log(`[FAIL] ${pathName} had ${failed} leaked points`);
    }
}

// Sample points along an SVG path by approximating lines/curves
function samplePoints(points) {
    const res = [];
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        for (let t = 0; t <= 1; t += 0.2) {
            res.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t]);
        }
    }
    return res;
}

// ==========================================
// 1. BACK PATHS (953 x 1650)
// ==========================================

const backPaths = {
    // Trapézio (Nuca até clavícula e centro das escápulas)
    'Trapezio': [
        [476, 160], [440, 200], [390, 240], [330, 280],
        [375, 295], [420, 310], [476, 375],
        [532, 310], [577, 295], [622, 280],
        [562, 240], [512, 200], [476, 160]
    ],
    // Ombros / Deltoide Posterior Esquerdo
    'Ombro_Left': [
        [330, 280], [275, 305], [242, 345], [252, 405],
        [285, 420], [315, 395], [330, 340], [330, 280]
    ],
    // Ombros / Deltoide Posterior Direito
    'Ombro_Right': [
        [622, 280], [677, 305], [710, 345], [700, 405],
        [667, 420], [637, 395], [622, 340], [622, 280]
    ],
    // Costas / Grande Dorsal Esquerdo (Lats)
    // Armpit is at (335, 415), torso ribcage down to waist (350, 675)
    'Costas_Left': [
        [476, 375], [420, 340], [350, 400], [335, 415],
        [340, 470], [352, 530], [355, 590], [345, 645],
        [340, 685], [410, 695], [476, 700], [476, 375]
    ],
    // Costas / Grande Dorsal Direito (Lats)
    'Costas_Right': [
        [476, 375], [532, 340], [602, 400], [617, 415],
        [612, 470], [600, 530], [597, 590], [607, 645],
        [612, 685], [542, 695], [476, 700], [476, 375]
    ],
    // Tríceps Esquerdo (Braço)
    'Triceps_Left': [
        [252, 405], [230, 445], [195, 495], [165, 540], [140, 570],
        [185, 565], [225, 530], [260, 480], [285, 420], [252, 405]
    ],
    // Tríceps Direito (Braço)
    'Triceps_Right': [
        [700, 405], [722, 445], [757, 495], [787, 540], [812, 570],
        [767, 565], [727, 530], [692, 480], [667, 420], [700, 405]
    ],
    // Antebraço Esquerdo (Cotovelo ao punho)
    'Antebraco_Left': [
        [140, 570], [115, 620], [80, 665], [45, 715], [18, 755],
        [40, 775], [75, 750], [115, 690], [155, 630], [185, 565], [140, 570]
    ],
    // Antebraço Direito (Cotovelo ao punho)
    'Antebraco_Right': [
        [812, 570], [837, 620], [872, 665], [907, 715], [934, 755],
        [912, 775], [877, 750], [837, 690], [797, 630], [767, 565], [812, 570]
    ],
    // Glúteo Esquerdo
    'Gluteo_Left': [
        [476, 700], [410, 695], [340, 685], [325, 730], [318, 790], [325, 845],
        [365, 875], [420, 875], [476, 870], [476, 700]
    ],
    // Glúteo Direito
    'Gluteo_Right': [
        [476, 700], [542, 695], [612, 685], [627, 730], [634, 790], [627, 845],
        [587, 875], [532, 875], [476, 870], [476, 700]
    ],
    // Isquiotibial Esquerdo (Posterior de Coxa)
    'Isquiotibial_Left': [
        [476, 870], [420, 875], [365, 875], [325, 890],
        [330, 950], [345, 1010], [358, 1070], [363, 1125],
        [410, 1130], [455, 1125], [465, 1050], [470, 970], [476, 870]
    ],
    // Isquiotibial Direito (Posterior de Coxa)
    'Isquiotibial_Right': [
        [476, 870], [532, 875], [587, 875], [627, 890],
        [622, 950], [607, 1010], [594, 1070], [589, 1125],
        [542, 1130], [497, 1125], [487, 1050], [482, 970], [476, 870]
    ],
    // Panturrilha Esquerda (Gastrocnêmio + Sóleo)
    'Panturrilha_Left': [
        [363, 1125], [358, 1180], [356, 1235], [362, 1285],
        [373, 1340], [386, 1395], [392, 1445], [415, 1455],
        [445, 1445], [450, 1385], [463, 1315], [467, 1245],
        [464, 1180], [455, 1125], [363, 1125]
    ],
    // Panturrilha Direita (Gastrocnêmio + Sóleo)
    'Panturrilha_Right': [
        [589, 1125], [594, 1180], [596, 1235], [590, 1285],
        [579, 1340], [566, 1395], [560, 1445], [537, 1455],
        [507, 1445], [502, 1385], [489, 1315], [485, 1245],
        [488, 1180], [497, 1125], [589, 1125]
    ]
};

console.log('--- TESTING BACK PATHS ---');
for (const [name, poly] of Object.entries(backPaths)) {
    checkPathPoints(backPng, name, samplePoints(poly));
}
