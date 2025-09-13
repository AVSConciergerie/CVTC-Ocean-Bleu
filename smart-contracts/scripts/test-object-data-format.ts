import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TEST FORMAT OBJET AVEC PROPRIÉTÉ DATA");
  console.log("=======================================");

  // Simuler le format d'objet que nous recevons
  const mockResult = {
    data: "0x950c9e7ea88bef525e5ffa072e7f092e2b0f751600000000000000000000000000000000000000000000000000000000000249f000000000000000000000000000000000000000000000000000000000000088b8532fc49071656c16311f2f89e6e41c53243355d3000000000000000000000000000000000000000000000000"
  };

  console.log("🔍 Objet simulé:", mockResult);
  console.log("🔍 Propriété data:", mockResult.data);
  console.log("🔍 Type de data:", typeof mockResult.data);
  console.log("🔍 Data est bytes-like:", ethers.isBytesLike(mockResult.data));

  try {
    // Tester la logique de traitement
    console.log("\\n🔍 Test de traitement...");

    let processedData;

    // CAS 1: Objet avec propriété data
    if (mockResult && typeof mockResult === 'object' && mockResult.data) {
      console.log('🔄 Extraction propriété data:', mockResult.data);

      if (ethers.isBytesLike(mockResult.data)) {
        console.log('✅ Propriété data déjà en bytes');
        processedData = mockResult.data;
      } else if (typeof mockResult.data === 'string' && mockResult.data.startsWith('0x')) {
        console.log('🔄 Conversion propriété data string vers bytes');
        processedData = ethers.getBytes(mockResult.data);
      } else {
        console.log('⚠️ Format de data inattendu');
        processedData = ethers.getBytes(mockResult.data);
      }
    }

    console.log('✅ Données traitées:', processedData);
    console.log('✅ Longueur:', processedData.length);
    console.log('✅ Type:', typeof processedData);

    // Vérifier que c'est bien des bytes
    console.log('✅ Est bytes-like:', ethers.isBytesLike(processedData));

    // Convertir en hex pour vérification
    const hexResult = ethers.hexlify(processedData);
    console.log('✅ En hex:', hexResult);

    console.log("\\n🎉 TRAITEMENT RÉUSSI !");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch(console.error);