export default function(regl: any): any {
    return regl({
        frag: `
        precision highp float;
        precision highp int;
        uniform sampler2D state;
        uniform sampler2D tile_district_colors;
        uniform sampler2D tile_district_values;
        uniform sampler2D voters;
        uniform sampler2D color_scale;
        uniform vec2 u_size;
        varying vec2 uv;

        const float s16 = 65535.0;
        const float s8  = 256.0;
        uniform float border_radius;
        uniform float nx;
        uniform float ny;
        uniform float mix_p;
        uniform float n_districts;
        uniform float color_texture_size;
        uniform float voters_texture_size;
        uniform float n_tiles;
        uniform int n_solutions;
        uniform int selected_id;

        const vec3 BLACK = vec3(0.0, 0.0, 0.0);
        const vec3 YELLOW = vec3(243./255., 232./255., 65./255.);

        int roundp(float x) { 
            // Round to nearest whole number for positive values.
            return int(x + 0.5);
        }

        vec2 idx_to_xy(int tile_index, vec2 cell) {
            float global_index = float(tile_index) + ((cell.y * nx)+cell.x) * n_tiles;
            return vec2(
                (mod( global_index, color_texture_size )) / color_texture_size,
                floor( global_index / color_texture_size ) / color_texture_size
            );
        }

        int get_tile_index(vec2 _uv, vec2 cell) {
            vec2 cell_shape = vec2(1.0/nx, 1.0/ny);
            /*  cell_uv is the relative offset within the cell.  */
            vec2 cell_uv = vec2(mod(_uv.x, cell_shape.x) / cell_shape.x,
                                mod(_uv.y, cell_shape.y) / cell_shape.y);            
            vec3 value = texture2D(state, cell_uv.yx).xyz;
            int tile_index = roundp(value.g * 255.0) * 256 + roundp(value.b * 255.0) - 1;
            return tile_index;
        }

        vec4 get_dist_data(int tile_index, vec2 cell) {
            if (tile_index == -1) {
                return vec4(0.0,0.0,0.0,-1.0);
            }
            vec2 colorPos = idx_to_xy(tile_index, cell);
            float color_value = texture2D(tile_district_colors, colorPos).x;
            float dist_idx = float(roundp(texture2D(tile_district_values, colorPos).x * n_districts));
            vec3 color = texture2D(color_scale, vec2(color_value, 0.0)).rgb;
            return vec4(color, dist_idx);
        }

        vec3 get_voter_color(int tile_index) {
            vec2 xy = vec2(
                floor( float(tile_index) / voters_texture_size ) / voters_texture_size,
                (mod( float(tile_index), voters_texture_size )) / voters_texture_size
            );
            float color_value = texture2D(voters, xy).x;
            return texture2D(color_scale, vec2(color_value, 0.0)).rgb;
        }

        vec2 get_cell(vec2 _uv) {
            return vec2(floor(_uv.x * nx), floor(_uv.y * ny));
        }

        void main() {
            // We are drawing a grid of states. First find the cell index.
            vec2 cell = get_cell(uv);
            int cell_idx = int((cell.y*nx)+cell.x);
            
            if (cell_idx >= n_solutions) {
                discard;
            }
            
            int tile_index = get_tile_index(uv, cell);
            vec4 dist_data = get_dist_data(tile_index, cell);
            vec3 dist_color = dist_data.rgb;
            float dist_idx  = dist_data.a;
            vec3 voter_color = get_voter_color(tile_index);

            vec2 uv_top    = vec2(uv+vec2(0.0, -border_radius)*u_size);
            vec2 uv_left   = vec2(uv+vec2(-border_radius, 0.0)*u_size);
            vec2 uv_bottom = vec2(uv+vec2(0.0, border_radius)*u_size);
            vec2 uv_right  = vec2(uv+vec2(border_radius, 0.0)*u_size);

            int ti_left   = get_tile_index(uv_left, cell);
            int ti_top    = get_tile_index(uv_top, cell);
            int ti_right  = get_tile_index(uv_right, cell);
            int ti_bottom = get_tile_index(uv_bottom, cell);

            bool dist_border = (get_dist_data(ti_top, cell).a != dist_idx) || \
                               (get_dist_data(ti_right, cell).a != dist_idx) || \
                               (get_dist_data(ti_bottom, cell).a != dist_idx) || \
                               (get_dist_data(ti_left, cell).a != dist_idx);

            /*
            bool cell_border = !all(equal(cell, get_cell(uv_top))) || \
                               !all(equal(cell, get_cell(uv_left))) ||
                               !all(equal(cell, get_cell(uv_right))) || \
                               !all(equal(cell, get_cell(uv_bottom)));
            
            if (cell_border && draw_cell_borders) {
                gl_FragColor = vec4(BLACK, 1.0);
            } else 
            */
            if (dist_border) {
                gl_FragColor = cell_idx == selected_id ? vec4(YELLOW, 0.5) : vec4(BLACK, 1.0);
            } else if (tile_index == -1) {
                discard;
            } else {                
                gl_FragColor = vec4(mix(dist_color, voter_color, mix_p), 1.0);
            }
        }`,
        vert: `
        precision highp float;
        attribute vec2 position;
        varying vec2 uv;
        void main () {
          // uv = vec2(position.y, 1.0 - position.x);
          uv = vec2(1.0 - position.x, position.y);
          gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
        }`,
        attributes: {
            position: [-2, 0, 0, -2, 2, 2]
        },
        uniforms: {
            nx: regl.prop('nx'),
            ny: regl.prop('ny'),
            n_districts: regl.prop('n_districts'),
            mix_p: regl.prop('mix'),
            voters: regl.prop('voters'),
            n_solutions: regl.prop('n_solutions'),
            selected_id: regl.prop('selected_id'),
            state: regl.prop('state'),
            tile_district_values: regl.prop('tile_district_values'),
            tile_district_colors: regl.prop('tile_district_colors'),
            color_scale: regl.prop('color_scale'),
            n_tiles: regl.prop('n_tiles'),
            color_texture_size: regl.prop('color_texture_size'),
            voters_texture_size: regl.prop('voters_texture_size'),
            border_radius: regl.prop('border_radius'),
            u_size: ctx => [1 / ctx.framebufferHeight, 1 / ctx.framebufferWidth],
        },
        count: 3
    })
}