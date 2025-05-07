import { useSelector } from 'react-redux';
import { useParameter } from '../../hooks/useParameter';
import type { RootState } from '../../redux/store/root';

export const OutputPrefix = () => {
  const { prefixOutput } = useSelector((state: RootState) => state.parameter);
  const { setParameter } = useParameter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setParameter({
        prefixOutput: '',
      });
      return;
    }
    setParameter({
      prefixOutput: e.target.value,
    });
  };

  return (
    <tr className="parameter-item">
      <td className="parameter-item-title">Output prefix</td>
      <td className="parameter-item-value">
        <input
          type="text"
          name="prefix"
          value={prefixOutput}
          onChange={handleInputChange}
        ></input>
      </td>
    </tr>
  );
};
