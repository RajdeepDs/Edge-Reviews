export function OfferBanner(){
    return (
        <div style={{
            backgroundColor: "#dfedfe",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px",
            marginTop: "16px",
            border: "1px solid #94a7b4",
            fontSize: "14px",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
            }}>
                <span style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#005082",
                    borderRadius: "20%",
                    color: "#fff",
                    padding: "4px",
                    border: "1px solid #dfe9f5",
                    marginRight: "12px",
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="100%" height="100%"><path d="M12.973 2.5v7c0 .276.236.5.527.5h5.972c.418 0 .67.44.442.773l-7.919 10.999c-.286.417-.968.225-.968-.273V15.5c0-.276-.236-.5-.527-.5H4.528c-.412 0-.665-.428-.45-.761l7.92-12c.277-.43.975-.243.975.262Z"></path></svg>
                </span>            
                <div>
                    <s-heading>Limited time offer! Get a 14-day trial of our AI-powered plan for $49.99/mo
                    </s-heading>
                    <s-text>Boost conversions with AI review highlights, smart sorting, and automatic translation.</s-text>
                </div>
            </div>
            <div style={{display:"flex", alignItems: "center", gap: "8px"}}>
                <button style={{
                    backgroundColor: "#fff",
                    color: "#000",
                    padding: "12px 8px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "550",
                    transition: "background-color 0.3s ease",
                }}>Upgrade now</button>
                <s-button icon="x" variant="tertiary"/>
            </div>
        </div>
    )
}