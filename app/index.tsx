import { initDatabase } from "@/database/db";
import NotesRepository, {
  NoteType,
} from "@/database/repositories/notes.repository";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const [notas, setNotas] = useState<never[] | NoteType[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const noteRepository = new NotesRepository();
  function getNotas() {
    const n = noteRepository.getAll();
    setNotas(n);
  }
  function createNote() {
    try {
      noteRepository.create({ text, title });
      setText("");
      setTitle("");
      getNotas();
      Alert.alert("Deu bom!");
    } catch (e) {
      Alert.alert("Erro ao inserir nota");
    }
  }

  useEffect(() => {
    initDatabase();
    getNotas();
  }, []);
  return (
    <SafeAreaView>
      <View>
        <View>
          <TextInput
            placeholder="Titulo"
            value={title}
            onChangeText={(t) => setTitle(t)}
          />
          <TextInput
            placeholder="Texto"
            value={text}
            onChangeText={(t) => setText(t)}
          />
          <Button title="Salvar" onPress={() => createNote()} />
        </View>
        <View>
          <FlatList
            data={notas}
            renderItem={(nota) => (
              <View>
                <Text>{nota.item.title}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
