<script setup lang="ts">
import { aboutImage } from '@shared/catalog'
</script>

<template>
  <div class="wrap page">
    <div class="page-head">
      <div>
        <p class="eyebrow">The workshop</p>
        <h1>Built on NW 11th.</h1>
      </div>
      <p class="quiet" style="max-width: 36ch">Halden is a furniture shop. We make the frames downstairs and throw a small run of ceramics upstairs.</p>
    </div>
    <div class="essay" style="padding-top: 12px">
      <img :src="aboutImage" alt="A woodworking bench with timber and hand tools" />
      <div class="essay-copy" style="margin-top: 0">
        <p>Most seating and tables are made after you order them. That keeps the shop from holding a warehouse of frames, and it means a piece can be oiled again in five years because we still know how it was built.</p>
        <p>If a frame we made needs a repair, write to the shop with the order number. Cushions can be refilled. Oil finishes can be patched. We don’t take work we didn’t build.</p>
        <router-link class="btn" to="/shop">Shop current work</router-link>
      </div>
    </div>
    <dl class="specs">
      <div><dt>Showroom</dt><dd>418 NW 11th Avenue, Portland</dd></div>
      <div><dt>Hours</dt><dd>Tuesday–Saturday, 11–6</dd></div>
      <div><dt>Made to order</dt><dd>Usually 3–6 weeks</dd></div>
      <div><dt>In-stock goods</dt><dd>Textiles and ceramics, 3 days</dd></div>
    </dl>
  </div>
</template>
