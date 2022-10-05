import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";

export default function ApiInfo() {
  return (
    <Box pt={2} px={2}>
      <Tabs>
        <TabList>
          <Tab>Api</Tab>
          <Tab>Edit</Tab>
          <Tab>Mock</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <p>one!</p>
          </TabPanel>
          <TabPanel>
            <p>two!</p>
          </TabPanel>
          <TabPanel>
            <p>three!</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
