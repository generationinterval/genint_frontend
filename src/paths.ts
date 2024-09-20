export const paths = {
    home: '/',
    summary_stats: {
      per_ind: '/summstats/ind',
      per_group: '/summstats/group',
      per_frag: '/summstats/frag',
    },
    fragment: {
        vis_per_ind: '/frag/visind',
        comp_per_ind: '/frag/compind',
        vis_per_reg: '/frag/visreg',
      },
      /* Faltan:
      Region sequencence accumulation
      HMM probability stats per individual
      Outgroup filter stats per individual
      Table summary stats per individual
       */
  } as const;