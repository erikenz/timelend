async function evaluateProof({ description, proof }) {
  const normalizedDescription = description.trim().toLowerCase();
  const normalizedProof = proof.trim().toLowerCase();

  if (!normalizedDescription || !normalizedProof) {
    return "FAIL";
  }

  if (normalizedProof.includes("fail")) {
    return "FAIL";
  }

  if (normalizedProof.includes("done")) {
    return "PASS";
  }

  return "FAIL";
}

module.exports = {
  evaluateProof,
};
