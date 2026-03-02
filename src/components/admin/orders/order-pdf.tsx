import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type OrderPdfModel = {
  orderNumber: string;
  createdAt: string;
  status: string;
  priority: string;
  expectedDate: string | null;
  internalNotes: string | null;
  clientName: string;
  serviceType: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 18,
    color: "#1A4F8A",
    fontWeight: "bold",
  },
  muted: {
    fontSize: 9,
    color: "#718096",
  },
  title: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A202C",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #E2E8F0",
    paddingVertical: 8,
  },
  label: {
    fontSize: 10,
    color: "#4A5568",
  },
  value: {
    fontSize: 10,
    color: "#1A202C",
    fontWeight: "bold",
  },
  notes: {
    marginTop: 14,
    fontSize: 10,
    color: "#2D3748",
    lineHeight: 1.5,
  },
});

export function OrderPDF({ order }: { order: OrderPdfModel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Svitlytsya Maystra</Text>
            <Text style={styles.muted}>Admin export document</Text>
          </View>
          <View>
            <Text style={styles.brand}>{order.orderNumber}</Text>
            <Text style={styles.muted}>{order.createdAt}</Text>
          </View>
        </View>

        <Text style={styles.title}>Order details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Client</Text>
          <Text style={styles.value}>{order.clientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{order.serviceType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{order.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Priority</Text>
          <Text style={styles.value}>{order.priority}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Expected date</Text>
          <Text style={styles.value}>{order.expectedDate ?? "-"}</Text>
        </View>

        <Text style={styles.notes}>
          Internal notes: {order.internalNotes && order.internalNotes.length > 0 ? order.internalNotes : "-"}
        </Text>
      </Page>
    </Document>
  );
}
