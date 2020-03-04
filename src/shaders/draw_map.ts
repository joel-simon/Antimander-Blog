export default function(regl: any): any {
    return regl({
        frag: `
        precision highp float;
        uniform sampler2D map;
        uniform sampler2D colors;
        varying vec2 uv;

        uniform float nx;
        uniform float ny;
        uniform float color_texture_size;
        uniform float n_tiles;

        const float s16 = 65653.0;
        const float s8  = 256.0;
        const vec3 RED   = vec3(1.0, 0.0, 0.0);
        const vec3 BLUE  = vec3(0.0, 0.0, 1.0);
        const vec3 WHITE = vec3(1.0, 1.0, 1.0);

        // vec4 RdBu(float value) {
            // return rdbu_colors[int(value * 512)]
            // if (value < 0.5) {
            //     float p = value / 0.5;
            //     return vec4(mix(BLUE, WHITE, p), 1.0);
            // } else {
            //     float p = (value - 0.5) / 0.5;
            //     return vec4(mix(WHITE, RED, p), 1.0);
            // }
        // }

        vec2 tileIdx2colorPos(int tile_index, vec2 cell) {
            float global_index = float(tile_index) + ((cell.y * nx)+cell.x) * n_tiles;
            return vec2(
                (mod( global_index, color_texture_size )) / color_texture_size,
                floor( global_index / color_texture_size ) / color_texture_size
            );
        }

        void main () {
            // We are drawing a grid of maps. First find the cell index.
            vec2 cell = vec2(floor(uv.x * nx), floor(uv.y * ny));

            // Calculate offset within this cell.
            vec2 cell_shape = vec2(1.0/nx, 1.0/ny);
            vec2 cell_uv = vec2((uv.x - cell.x*cell_shape.x)/cell_shape.x,
                                (uv.y - cell.y*cell_shape.y)/cell_shape.y);

            vec3 value = texture2D(map, cell_uv).rgb;
            int tile_index = int(value.r * 255.0*s16) + (int(value.g * 255.0 *s8)) + int(value.b * 255.0);
            if (tile_index == 0) {
                discard;
            }
            vec2 colorPos = tileIdx2colorPos(tile_index - 1, cell);
            // float color_value = texture2D(colors, colorPos).r;
            // gl_FragColor = RdBu(color_value);
            gl_FragColor = vec4(texture2D(colors, colorPos).rgb, 1.0);
            // gl_FragColor = vec4(texture2D(map, uv).rgb, 1.0);
        }`,
        vert: `
        precision highp float;
        attribute vec2 position;
        varying vec2 uv;
        void main () {
          uv = vec2(position.y, 1.0 - position.x);
          gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
        }`,
        attributes: {
            position: [-2, 0, 0, -2, 2, 2]
        },
        uniforms: {
            nx: regl.prop('ny'),
            ny: regl.prop('nx'),
            map: regl.prop('map'),
            colors: regl.prop('colors'),
            n_tiles: regl.prop('n_tiles'),
            color_texture_size: regl.prop('color_texture_size')
        },
        count: 3
    })
}