<script setup lang="ts">
import qrDonate from '@/assets/svg/qr-donate.svg'
import qrStore from '@/assets/svg/qr-store.svg'
</script>

<template>
  <section class="qr-grid" aria-label="Support Project Bluefin">
    <article class="qr-card">
      <h3 class="qr-title">
        Store Access
      </h3>
      <div class="qr-image-box">
        <img :src="qrStore" alt="QR code for the Project Bluefin store">
      </div>
      <div class="qr-action-wrap">
        <a href="https://store.projectbluefin.io" target="_blank" rel="noopener noreferrer" class="qr-btn blue">
          VISIT STORE
        </a>
        <span class="qr-domain">store.projectbluefin.io</span>
      </div>
    </article>

    <article class="qr-card">
      <h3 class="qr-title">
        Donate Funds
      </h3>
      <div class="qr-image-box">
        <img :src="qrDonate" alt="QR code for Project Bluefin donations">
      </div>
      <div class="qr-action-wrap">
        <a href="https://docs.projectbluefin.io/donations" target="_blank" rel="noopener noreferrer" class="qr-btn dark">
          DONATE
        </a>
        <span class="qr-domain">docs.projectbluefin.io/donations</span>
      </div>
    </article>
  </section>
</template>

<style scoped lang="scss">
.qr-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;

  @media (min-width: 600px) {
    flex-direction: row;
  }
}

.qr-card {
  flex: 1;
  background-color: #10151f;
  border: 1px solid #272727;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.qr-title {
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #ffffff;
  margin: 0;
}

.qr-image-box {
  width: 192px;
  height: 192px;
  background-color: #0c1016;
  border: 1px solid #272727;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05);
  }
}

.qr-image-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-action-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.qr-btn {
  display: inline-block;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 24px;
  border-radius: 20px;
  text-decoration: none;
  transition: background-color 0.2s;
}

.qr-btn.blue {
  background-color: var(--color-blue);
}

.qr-btn.blue:hover {
  background-color: var(--color-blue-light);
}

.qr-btn.dark {
  background-color: #272727;
}

.qr-btn.dark:hover {
  background-color: #1e1e1e;
}

.qr-domain {
  font-size: 1.1rem;
  color: #616161;
}
</style>
