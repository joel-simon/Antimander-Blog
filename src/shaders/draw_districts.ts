export default function(regl: any): any {
    return regl({
        frag: `
        precision highp float;
        precision highp int;
        uniform sampler2D state;
        uniform sampler2D colors;
        uniform sampler2D voters;
        // uniform sampler2D background;
        uniform sampler2D color_scale;
        uniform vec2 u_size;
        varying vec2 uv;

        uniform float nx;
        uniform float ny;
        uniform float mix_p;
        uniform float n_solutions;
        uniform float color_texture_size;
        uniform float n_tiles;
        uniform float selected_id;

        const float s16 = 65535.0;
        const float s8  = 256.0;
        const vec3 RED   = vec3(1.0, 0.0, 0.0);
        const vec3 BLUE  = vec3(0.0, 0.0, 1.0);
        const vec3 WHITE = vec3(1.0, 1.0, 1.0);
        const vec3 BLACK = vec3(0.0, 0.0, 0.0);
        const vec3 YELLOW = vec3(243./255., 232./255., 65./255.);

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
            vec3 value = texture2D(state, cell_uv).rgb;
            int tile_index = int(value.r * 255.0*s16) + (int(value.g * 255.0 *s8)) + int(value.b * 255.0);
            return tile_index;
        }

        vec3 get_dist_color(int tile_index, vec2 cell) {
            vec2 colorPos = tileIdx2colorPos(tile_index - 1, cell);
            float color_value = texture2D(colors, colorPos).x;
            vec3 color = texture2D(color_scale, vec2(color_value, 0.0)).rgb;
            return color;
        }

        vec3 get_voter_color(int tile_index) {
            float color_value = texture2D(voters, vec2(float(tile_index) / n_tiles, 0.0)).x;
            return texture2D(color_scale, vec2(color_value, 0.0)).rgb;
        }

        vec2 get_cell(vec2 _uv) {
            return vec2(floor(_uv.x * nx), floor(_uv.y * ny));
        }

        void main () {
            // We are drawing a grid of states. First find the cell index.
            vec2 cell = get_cell(uv);
            
            if (cell.x + cell.y*nx >= n_solutions) {
                discard;
            }
            
            int tile_index = get_tile_index(uv, cell);
            if (tile_index == 0) {
                discard;
            }
            
            vec3 dist_color = get_dist_color(tile_index, cell);
            vec3 voter_color = get_voter_color(tile_index);
            
            vec2 uv_top    = vec2(uv+vec2(0.0, -1.0)*u_size);
            vec2 uv_left   = vec2(uv+vec2(-1.0, 0.0)*u_size);
            vec2 uv_bottom = vec2(uv+vec2(0.0, 1.0)*u_size);
            vec2 uv_right  = vec2(uv+vec2(1.0, 0.0)*u_size);

            int ti_left   = get_tile_index(uv_left, cell);
            int ti_top    = get_tile_index(uv_top, cell);
            int ti_right  = get_tile_index(uv_right, cell);
            int ti_bottom = get_tile_index(uv_bottom, cell);

            bool eq = all(equal(dist_color, get_dist_color(ti_top, cell))) && \
                      all(equal(dist_color, get_dist_color(ti_left, cell))) && \
                      all(equal(dist_color, get_dist_color(ti_right, cell))) && \
                      all(equal(dist_color, get_dist_color(ti_bottom, cell)));
            
            bool cell_border = \
                !all(equal(cell, get_cell(uv_top))) || \
                !all(equal(cell, get_cell(uv_left))) ||
                !all(equal(cell, get_cell(uv_right))) || \
                !all(equal(cell, get_cell(uv_bottom)));

            vec2 cell_shape = vec2(1.0/nx, 1.0/ny);
            vec2 cell_uv = vec2((uv.x - cell.x*cell_shape.x)/cell_shape.x,
                                (uv.y - cell.y*cell_shape.y)/cell_shape.y);

            if (cell_border) {
                gl_FragColor = vec4(BLACK, 1.0);
            } else if (!eq) {
                bool is_selected = floor((cell.y*nx)+cell.x) == selected_id;
                gl_FragColor = is_selected ? vec4(YELLOW, 0.5) : vec4(BLACK, 1.0);
            } else {
                gl_FragColor = vec4(mix(dist_color, voter_color, mix_p), 1.0);
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
            mix_p: regl.prop('mix'),
            voters: regl.prop('voters'),
            n_solutions: regl.prop('n_solutions'),
            selected_id: regl.prop('selected_id'),
            state: regl.prop('state'),
            colors: regl.prop('colors'),
            // background: regl.prop('background'),
            color_scale: regl.prop('color_scale'),
            n_tiles: regl.prop('n_tiles'),
            color_texture_size: regl.prop('color_texture_size'),
            u_size: ctx => [1 / ctx.framebufferWidth, 1 / ctx.framebufferHeight],
        },
        count: 3
    })
}
            
/*
vec2 cell_shape = vec2(1.0/nx, 1.0/ny);
vec2 cell_uv = vec2((uv.x - cell.x*cell_shape.x)/cell_shape.x,
                    (uv.y - cell.y*cell_shape.y)/cell_shape.y);
vec3 value = texture2D(state, cell_uv).rgb;
// float tile_index = float(int(value.r * 255.0*s16) + (int(value.g * 255.0 *s8)) + int(value.b * 255.0));
// float derp = floor(value.b);
gl_FragColor = vec4(
    floor(value.g * 255.0) / 255.0,
    0.0, 0.0, 1.0
);
*/
// gl_FragColor = vec4((tile_index) / 7000.0, 0.0, 0.0, 1.0);

