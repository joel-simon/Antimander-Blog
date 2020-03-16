export default function(regl: any): any {
    return regl({
        frag: `
        precision highp float;
        uniform sampler2D map;
        uniform sampler2D colors;
        uniform sampler2D all_colors;
        uniform vec2 u_size;
        varying vec2 uv;

        uniform float nx;
        uniform float ny;
        uniform float color_texture_size;
        uniform float n_tiles;
        uniform float selected_id;

        const float s16 = 65653.0;
        const float s8  = 256.0;
        const vec3 RED   = vec3(1.0, 0.0, 0.0);
        const vec3 BLUE  = vec3(0.0, 0.0, 1.0);
        const vec3 WHITE = vec3(1.0, 1.0, 1.0);
        const vec3 YELLOW = vec3(252.0/255.0, 198.0/255.0, 3.0/255.0);


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

        int get_tile_index(vec2 _uv, vec2 cell) {
            vec2 cell_shape = vec2(1.0/nx, 1.0/ny);
            vec2 cell_uv = vec2((_uv.x - cell.x*cell_shape.x)/cell_shape.x,
                                (_uv.y - cell.y*cell_shape.y)/cell_shape.y);
            vec3 value = texture2D(map, cell_uv).rgb;
            int tile_index = int(value.r * 255.0*s16) + (int(value.g * 255.0 *s8)) + int(value.b * 255.0);
            return tile_index;
        }

        vec3 get_color(int tile_index, vec2 cell) {
            vec2 colorPos = tileIdx2colorPos(tile_index - 1, cell);
            float color_value = texture2D(colors, colorPos).x;

            vec3 color = texture2D(all_colors, vec2(color_value, 0.0)).rgb;
            return color;
            // return vec3(color_value, 0.0, 0.0);
            // vec3 color = texture2D(colors, colorPos).rgb;
            // return color;
        }

        void main () {
            // We are drawing a grid of maps. First find the cell index.
            vec2 cell = vec2(floor(uv.x * nx), floor(uv.y * ny));

            // Calculate offset within this cell.
            int tile_index = get_tile_index(uv, cell);
            if (tile_index == 0) {
                discard;
            }

            vec3 color = get_color(tile_index, cell);
            int ti_left = get_tile_index(vec2(uv+vec2(0.0, -1.0)*u_size), cell);
            int ti_top = get_tile_index(vec2(uv+vec2(-1.0, 0.0)*u_size), cell);
            //int ti_top_left = get_tile_index(vec2(uv+vec2(-1.0, -1.0)*u_size), cell);

            int ti_right = get_tile_index(vec2(uv+vec2(0.0, 1.0)*u_size), cell);
            int ti_bottom = get_tile_index(vec2(uv+vec2(1.0, -0.0)*u_size), cell);

            bool eq = all(equal(color, get_color(ti_top, cell))) && \
                      all(equal(color, get_color(ti_left, cell))) && \
                      all(equal(color, get_color(ti_right, cell))) && \
                      all(equal(color, get_color(ti_bottom, cell)));

            if (!eq) {
                bool is_selected = floor((cell.y*nx)+cell.x) == selected_id;
                gl_FragColor = is_selected ? vec4(YELLOW, 0.3) : vec4(WHITE, 1.0);
            } else {
                gl_FragColor = vec4(color, 1.0);
            }
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
            selected_id: regl.prop('selected_id'),
            map: regl.prop('map'),
            colors: regl.prop('colors'),
            all_colors: regl.prop('all_colors'),
            n_tiles: regl.prop('n_tiles'),
            color_texture_size: regl.prop('color_texture_size'),
            u_size: ctx => [1 / ctx.framebufferWidth, 1 / ctx.framebufferHeight],
        },
        count: 3
    })
}